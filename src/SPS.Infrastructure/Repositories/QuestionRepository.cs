using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Question;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 常見問題倉儲實現
/// </summary>
public class QuestionRepository : Repository<Question, int>, IQuestionRepository
{
    public QuestionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Question?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(q => q.Subject)
            .Include(q => q.Answer)
            .Include(q => q.Category)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Question>> GetPagedAsync(
        QuestionQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(q => q.Subject)
            .Include(q => q.Answer)
            .Include(q => q.Category)
            .AsQueryable();

        // 搜索過濾
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(q =>
                (q.Subject != null && q.Subject.DefaultText != null && q.Subject.DefaultText.Contains(parameters.Search)) ||
                (q.Answer != null && q.Answer.DefaultText != null && q.Answer.DefaultText.Contains(parameters.Search)));
        }

        // 分類過濾
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(q => q.CategoryId == parameters.CategoryId.Value);
        }

        // 發布狀態過濾
        if (parameters.Published.HasValue)
        {
            query = query.Where(q => q.Published == parameters.Published.Value);
        }

        // 總數
        var totalCount = await query.CountAsync(cancellationToken);

        // 排序
        query = ApplySorting(query, parameters.SortBy, parameters.Descending);

        // 分頁
        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Question>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    public async Task<List<Question>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(q => q.Subject)
            .Include(q => q.Answer)
            .Include(q => q.Category)
            .OrderBy(q => q.Ordinal)
            .ThenByDescending(q => q.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Question>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(q => q.Subject)
            .Include(q => q.Answer)
            .Include(q => q.Category)
            .Where(q => q.CategoryId == categoryId)
            .OrderBy(q => q.Ordinal)
            .ThenByDescending(q => q.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Question> ApplySorting(
        IQueryable<Question> query,
        string? sortBy,
        bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return query
                .OrderBy(q => q.Ordinal)
                .ThenByDescending(q => q.CreatedTime);
        }

        return sortBy.ToLower() switch
        {
            "ordinal" => descending
                ? query.OrderByDescending(q => q.Ordinal)
                : query.OrderBy(q => q.Ordinal),
            "createdtime" => descending
                ? query.OrderByDescending(q => q.CreatedTime)
                : query.OrderBy(q => q.CreatedTime),
            _ => query
                .OrderBy(q => q.Ordinal)
                .ThenByDescending(q => q.CreatedTime)
        };
    }
}
