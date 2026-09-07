using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 企業倉儲接口
/// </summary>
public interface ICompanyRepository : IRepository<Company, Guid>
{
    /// <summary>
    /// 根據統一編號獲取企業
    /// </summary>
    Task<Company?> GetByUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查統一編號是否存在
    /// </summary>
    Task<bool> ExistsByUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 分頁查詢企業列表
    /// </summary>
    Task<PagedResult<Company>> GetPagedAsync(
        CompanyQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取所有企業（無分頁）
    /// </summary>
    Task<List<Company>> GetAllAsync(CancellationToken cancellationToken = default);
}
