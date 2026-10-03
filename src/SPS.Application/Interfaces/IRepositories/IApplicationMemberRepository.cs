using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 申請成員 Repository 接口
/// </summary>
public interface IApplicationMemberRepository
{
    /// <summary>
    /// 根據 ID 獲取申請成員
    /// </summary>
    Task<ApplicationMember?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// 根據申請 ID 獲取所有成員（按 OrderIndex 排序）
    /// </summary>
    Task<List<ApplicationMember>> GetByApplicationIdAsync(Guid applicationId, CancellationToken ct = default);

    /// <summary>
    /// 根據 Email 獲取申請成員
    /// </summary>
    Task<ApplicationMember?> GetByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// 以信箱（不分大小寫）找出所有申請成員。申請人的信箱與電話存在成員上
    /// （<c>MemberApplication.Email／Phone</c> 在新流程是空的，只有舊資料才有），查詢進度要從這裡找
    /// </summary>
    Task<List<ApplicationMember>> FindByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// 檢查 Email 是否已存在（在 Members 或 ApplicationMembers 表中）
    /// </summary>
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// 檢查 Email 是否在指定申請中已存在
    /// </summary>
    Task<bool> ExistsByEmailInApplicationAsync(Guid applicationId, string email, CancellationToken ct = default);

    /// <summary>
    /// 統計申請的成員數量
    /// </summary>
    Task<int> CountByApplicationIdAsync(Guid applicationId, CancellationToken ct = default);

    /// <summary>
    /// 添加申請成員
    /// </summary>
    Task<ApplicationMember> AddAsync(ApplicationMember member, CancellationToken ct = default);

    /// <summary>
    /// 更新申請成員
    /// </summary>
    Task UpdateAsync(ApplicationMember member, CancellationToken ct = default);

    /// <summary>
    /// 刪除申請成員
    /// </summary>
    Task DeleteAsync(ApplicationMember member, CancellationToken ct = default);
}
