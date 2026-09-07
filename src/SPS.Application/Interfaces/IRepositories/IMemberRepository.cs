using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 會員倉儲接口
/// </summary>
public interface IMemberRepository : IRepository<Member, Guid>
{
    /// <summary>
    /// 根據郵箱獲取會員
    /// </summary>
    Task<Member?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查郵箱是否已存在
    /// </summary>
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據 RefreshToken 獲取會員
    /// </summary>
    Task<Member?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// 分頁查詢會員列表
    /// </summary>
    Task<PagedResult<Member>> GetPagedAsync(MemberQueryParameters parameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據 ID 獲取會員（包含公司資訊）
    /// </summary>
    Task<Member?> GetByIdWithCompanyAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據公司 ID 獲取會員列表
    /// </summary>
    Task<List<Member>> GetByCompanyIdAsync(Guid companyId, CancellationToken cancellationToken = default);
}
