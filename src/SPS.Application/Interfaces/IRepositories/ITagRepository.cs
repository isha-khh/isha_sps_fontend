using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Tag;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface ITagRepository : IRepository<Tag, int>
{
    Task<PagedResult<Tag>> GetPagedAsync(TagQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<Tag?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default);
    /// <summary>
    /// 取得指定分類下、同名的標籤（標籤名稱在同一分類內須唯一）。
    /// </summary>
    Task<Tag?> GetByNameAsync(string name, int? categoryId, CancellationToken cancellationToken = default);
    Task<int> GetUsageCountAsync(int tagId, CancellationToken cancellationToken = default);
    /// <summary>
    /// 取得指定 ID 集合中、屬於指定類型且實際存在的標籤 ID（用於綁定前驗證）。
    /// </summary>
    Task<List<int>> GetExistingTagIdsAsync(IEnumerable<int> tagIds, SPS.Domain.Enums.TagType type, CancellationToken cancellationToken = default);
    /// <summary>
    /// 以指定的標籤集合覆寫某實體的標籤綁定（不在集合內的解除、不存在的新增），由呼叫端負責 SaveChanges。
    /// </summary>
    Task ReplaceEntityTagsAsync(SPS.Domain.Enums.EntityType entityType, string entityId, IEnumerable<int> tagIds, CancellationToken cancellationToken = default);
    Task<Dictionary<string, List<int>>> GetTagIdsByEntityIdsAsync(SPS.Domain.Enums.EntityType entityType, IEnumerable<string> entityIds, CancellationToken cancellationToken = default);
    Task<Dictionary<int, string>> GetTagNamesByIdsAsync(IEnumerable<int> tagIds, CancellationToken cancellationToken = default);
}