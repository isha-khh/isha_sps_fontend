using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 申請文件倉儲接口
/// </summary>
public interface IApplicationDocumentRepository : IRepository<ApplicationDocument, Guid>
{
    /// <summary>
    /// 根據申請ID獲取文件列表
    /// </summary>
    Task<List<ApplicationDocument>> GetByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據申請ID和文件類型獲取文件
    /// </summary>
    Task<ApplicationDocument?> GetByApplicationIdAndTypeAsync(
        Guid applicationId,
        DocumentType type,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取過期文件
    /// </summary>
    Task<List<ApplicationDocument>> GetExpiredDocumentsAsync(
        DateTime expirationDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除申請的所有文件
    /// </summary>
    Task DeleteByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取需要清理的文件（基於保存期限）
    /// </summary>
    Task<List<ApplicationDocument>> GetDocumentsForCleanupAsync(
        CancellationToken cancellationToken = default);
}
