using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 上傳文件實體
/// </summary>
public class UploadedFile
{
    /// <summary>
    /// 文件唯一標識符
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 文件編號（業務編號）
    /// </summary>
    public string FileNumber { get; set; } = string.Empty;

    /// <summary>
    /// 原始文件名
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// 存儲文件名（系統生成的唯一文件名）
    /// </summary>
    public string StoredFileName { get; set; } = string.Empty;

    /// <summary>
    /// 存儲路徑（相對路徑）
    /// </summary>
    public string StoragePath { get; set; } = string.Empty;

    /// <summary>
    /// 文件擴展名
    /// </summary>
    public string FileExtension { get; set; } = string.Empty;

    /// <summary>
    /// 文件 MIME 類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件哈希值（用于去重和完整性校驗）
    /// </summary>
    public string FileHash { get; set; } = string.Empty;

    /// <summary>
    /// 上傳者 ID
    /// </summary>
    public Guid? UploadedBy { get; set; }

    /// <summary>
    /// 上傳者（導航屬性）
    /// </summary>
    public Member? Uploader { get; set; }

    /// <summary>
    /// 文件狀態
    /// </summary>
    public FileStatus Status { get; set; } = FileStatus.Active;

    /// <summary>
    /// 文件描述/備注
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 文件標簽（JSON 格式存儲）
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// 下載次數
    /// </summary>
    public int DownloadCount { get; set; } = 0;

    /// <summary>
    /// 最后訪問時間
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }

    /// <summary>
    /// 文件過期時間（可選）
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// 是否公開訪問
    /// </summary>
    public bool IsPublic { get; set; } = false;

    /// <summary>
    /// 創建時間
    /// </summary>
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedTime { get; set; }

    /// <summary>
    /// 刪除時間
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// 是否為資料夾
    /// </summary>
    public bool IsFolder { get; set; } = false;

    /// <summary>
    /// 父資料夾 ID
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// 是否為系統靜態檔案（從 wwwroot 掃描而來）
    /// </summary>
    public bool IsStaticFile { get; set; } = false;

    /// <summary>
    /// 靜態檔案相對路徑（相對於 wwwroot）
    /// </summary>
    public string? StaticFilePath { get; set; }

    /// <summary>
    /// 關聯產品 ID
    /// </summary>
    public int? ProductId { get; set; }

    /// <summary>
    /// 關聯產品（導航屬性）
    /// </summary>
    public Product? Product { get; set; }
}
