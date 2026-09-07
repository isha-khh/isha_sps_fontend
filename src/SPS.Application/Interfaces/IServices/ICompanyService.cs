using SPS.Application.Common;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 企業服務接口
/// </summary>
public interface ICompanyService
{
    /// <summary>
    /// 分頁查詢企業列表
    /// </summary>
    Task<Result<PagedResult<CompanyListItemResponse>>> GetPagedAsync(
        CompanyQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取企業詳情
    /// </summary>
    Task<Result<CompanyResponse>> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建企業
    /// </summary>
    Task<Result<CompanyResponse>> CreateAsync(
        CreateCompanyRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新企業
    /// </summary>
    Task<Result<CompanyResponse>> UpdateAsync(
        Guid id,
        UpdateCompanyRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除企業
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得企業目前綁定的企業標籤
    /// </summary>
    Task<Result<CompanyTagsResponse>> GetTagsAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 設定企業的企業標籤綁定（覆寫，支援多個標籤）
    /// </summary>
    Task<Result<CompanyTagsResponse>> SetTagsAsync(
        Guid id,
        SetCompanyTagsRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據統一編號獲取企業
    /// </summary>
    Task<Result<CompanyResponse>> GetByUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取公司統計數據
    /// </summary>
    Task<Result<CompanyStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除公司所有資料（包含關聯的圖片、產品、需求、成員等）
    /// </summary>
    Task<Result<bool>> DeleteAllCompanyDataAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次更新公司狀態
    /// </summary>
    Task<Result<BatchOperationResult>> BatchUpdateStatusAsync(
        BatchUpdateCompanyStatusRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次刪除公司
    /// </summary>
    Task<Result<BatchOperationResult>> BatchDeleteAsync(
        BatchDeleteCompanyRequest request,
        CancellationToken cancellationToken = default);
}
