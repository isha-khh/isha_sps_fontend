using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 申請文件
/// </summary>
public class ApplicationDocument : BaseEntity<Guid>
{
    /// <summary>
    /// 申請ID
    /// </summary>
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 文件類型
    /// </summary>
    public DocumentType Type { get; set; }

    /// <summary>
    /// 文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件路徑（相對路徑）
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// MIME 類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件哈希（SHA256）
    /// </summary>
    public string FileHash { get; set; } = string.Empty;

    /// <summary>
    /// 文件過期時間
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// 上傳文件 ID（關聯到文件管理系統）
    /// </summary>
    public Guid? UploadedFileId { get; set; }

    // ==================== 導航屬性 ====================

    /// <summary>
    /// 關聯申請
    /// </summary>
    public MemberApplication Application { get; set; } = null!;

    /// <summary>
    /// 關聯上傳文件（文件管理系統）
    /// </summary>
    public UploadedFile? UploadedFile { get; set; }
}
