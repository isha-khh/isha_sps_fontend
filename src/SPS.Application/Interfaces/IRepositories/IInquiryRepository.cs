using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Inquiry;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IRepositories;

public interface IInquiryRepository : IRepository<Inquiry, Guid>
{
    Task<PagedResult<Inquiry>> GetPagedAsync(InquiryQueryParameters parameters, CancellationToken ct = default);

    /// <summary>某會員是否已有尚未結案的同類型詢問單（訂閱解方避免重複送出）</summary>
    Task<bool> HasOpenAsync(Guid memberId, InquiryType type, CancellationToken ct = default);

    Task<InquiryCountsResponse> GetCountsAsync(CancellationToken ct = default);

    /// <summary>某一類對象（例如 SupportResource）底下每個項目收到的詢問單數量，key 是 TargetKey</summary>
    Task<Dictionary<string, int>> GetCountsByTargetAsync(string targetType, CancellationToken ct = default);

    /// <summary>符合條件的詢問單（不分頁，匯出用），最多 <paramref name="max"/> 筆，新的在前</summary>
    Task<List<Inquiry>> ListAsync(InquiryQueryParameters parameters, int max, CancellationToken ct = default);
}
