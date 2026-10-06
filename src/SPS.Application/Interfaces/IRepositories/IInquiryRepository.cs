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
}
