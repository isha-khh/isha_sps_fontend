using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Tag;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class TagRepository : Repository<Tag, int>, ITagRepository
{
    public TagRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Tag>> GetPagedAsync(TagQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(t => t.Category).AsQueryable();

        if (parameters.Type.HasValue)
            query = query.Where(t => t.Type == parameters.Type.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Name))
            query = query.Where(t => t.Name.Contains(parameters.Name));

        if (parameters.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == parameters.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(t => t.Name.Contains(parameters.Search));

        var totalCount = await query.CountAsync(cancellationToken);

        query = parameters.Descending
            ? query.OrderByDescending(t => t.Ordinal).ThenByDescending(t => t.CreatedTime)
            : query.OrderBy(t => t.Ordinal).ThenBy(t => t.CreatedTime);

        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Tag>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<Tag?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.Category)
            .Include(t => t.EntityTags)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<Tag?> GetByNameAsync(string name, int? categoryId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(t => t.Name == name && t.CategoryId == categoryId, cancellationToken);
    }

    public async Task<int> GetUsageCountAsync(int tagId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EntityTag>()
            .Where(et => et.TagId == tagId)
            .CountAsync(cancellationToken);
    }

    public async Task<List<int>> GetExistingTagIdsAsync(
        IEnumerable<int> tagIds,
        SPS.Domain.Enums.TagType type,
        CancellationToken cancellationToken = default)
    {
        var ids = tagIds.Distinct().ToList();
        if (ids.Count == 0)
            return new List<int>();

        return await _dbSet
            .Where(t => t.Type == type && ids.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task ReplaceEntityTagsAsync(
        SPS.Domain.Enums.EntityType entityType,
        string entityId,
        IEnumerable<int> tagIds,
        CancellationToken cancellationToken = default)
    {
        var set = _context.Set<EntityTag>();
        var existing = await set
            .Where(et => et.EntityType == entityType && et.EntityId == entityId)
            .ToListAsync(cancellationToken);

        var desired = tagIds.Distinct().ToHashSet();
        var existingIds = existing.Select(et => et.TagId).ToHashSet();

        // 解除不在目標集合內的綁定
        var toRemove = existing.Where(et => !desired.Contains(et.TagId)).ToList();
        if (toRemove.Count > 0)
            set.RemoveRange(toRemove);

        // 新增尚未存在的綁定（避免重複新增造成複合主鍵衝突）
        foreach (var tagId in desired.Where(id => !existingIds.Contains(id)))
        {
            set.Add(new EntityTag
            {
                TagId = tagId,
                EntityType = entityType,
                EntityId = entityId
            });
        }
    }

    public async Task<Dictionary<string, List<int>>> GetTagIdsByEntityIdsAsync(
        SPS.Domain.Enums.EntityType entityType,
        IEnumerable<string> entityIds,
        CancellationToken cancellationToken = default)
    {
        var ids = entityIds.ToList();
        var entityTags = await _context.Set<EntityTag>()
            .Where(et => et.EntityType == entityType && ids.Contains(et.EntityId))
            .Select(et => new { et.EntityId, et.TagId })
            .ToListAsync(cancellationToken);

        return entityTags
            .GroupBy(et => et.EntityId)
            .ToDictionary(g => g.Key, g => g.Select(et => et.TagId).ToList());
    }

    public async Task<Dictionary<int, string>> GetTagNamesByIdsAsync(
        IEnumerable<int> tagIds,
        CancellationToken cancellationToken = default)
    {
        var ids = tagIds.ToList();
        return await _dbSet
            .Where(t => ids.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);
    }
}