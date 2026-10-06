using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Inquiry;

namespace SPS.Application.Interfaces.IServices;

public interface IInquiryService
{
    /// <summary>前台送出。<paramref name="memberId"/> 是登入會員（匿名為 null）；<paramref name="isEnterpriseMember"/> 用來檢查提案只開放企業會員</summary>
    Task<Result<bool>> CreateAsync(CreateInquiryRequest request, Guid? memberId, bool isEnterpriseMember, string? clientIp, CancellationToken ct = default);

    Task<Result<PagedResult<InquiryResponse>>> GetPagedAsync(InquiryQueryParameters parameters, CancellationToken ct = default);
    Task<Result<InquiryResponse>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<InquiryResponse>> UpdateAsync(Guid id, UpdateInquiryRequest request, Guid? handledByUserId, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<Result<InquiryCountsResponse>> GetCountsAsync(CancellationToken ct = default);
}
