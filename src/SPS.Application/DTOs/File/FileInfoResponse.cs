using SPS.Domain.Enums;

namespace SPS.Application.DTOs.File;

/// <summary>
/// 文件信息響應
/// </summary>
public class FileInfoResponse
{
    /// <summary>
    /// 文件 ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 文件編號
    /// </summary>
    public string FileNumber { get; set; } = string.Empty;

    /// <summary>
    /// 原始文件名
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件擴展名
    /// </summary>
    public string FileExtension { get; set; } = string.Empty;

    /// <summary>
    /// 文件類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件大小（格式化）
    /// </summary>
    public string FormattedFileSize { get; set; } = string.Empty;

    /// <summary>
    /// 文件哈希值
    /// </summary>
    public string FileHash { get; set; } = string.Empty;

    /// <summary>
    /// 文件狀態
    /// </summary>
    public FileStatus Status { get; set; }

    /// <summary>
    /// 文件描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 文件標簽
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// 下載次數
    /// </summary>
    public int DownloadCount { get; set; }

    /// <summary>
    /// 是否公開訪問
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// 是否為資料夾
    /// </summary>
    public bool IsFolder { get; set; }

    /// <summary>
    /// 上傳者 ID
    /// </summary>
    public Guid? UploadedBy { get; set; }

    /// <summary>
    /// 上傳者名稱
    /// </summary>
    public string? UploaderName { get; set; }

    /// <summary>
    /// 文件訪問 URL
    /// </summary>
    public string FileUrl { get; set; } = string.Empty;

    /// <summary>
    /// 創建時間
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 最后訪問時間
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }

    /// <summary>
    /// 過期時間
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// 文件列表項響應
/// </summary>
public class FileListItemResponse
{
    /// <summary>
    /// 文件 ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 文件編號
    /// </summary>
    public string FileNumber { get; set; } = string.Empty;

    /// <summary>
    /// 原始文件名
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件擴展名
    /// </summary>
    public string FileExtension { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件大小（格式化）
    /// </summary>
    public string FormattedFileSize { get; set; } = string.Empty;

    /// <summary>
    /// 文件類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件狀態
    /// </summary>
    public FileStatus Status { get; set; }

    /// <summary>
    /// 是否為資料夾
    /// </summary>
    public bool IsFolder { get; set; }

    /// <summary>
    /// 上傳者名稱
    /// </summary>
    public string? UploaderName { get; set; }

    /// <summary>
    /// 創建時間
    /// </summary>
    public DateTime CreatedTime { get; set; }
}

/// <summary>
/// 文件查詢請求
/// </summary>
public class FileQueryRequest
{
    /// <summary>
    /// 搜索關鍵字（文件名）
    /// </summary>
    public string? Keyword { get; set; }

    /// <summary>
    /// 文件狀態過濾
    /// </summary>
    public FileStatus? Status { get; set; }

    /// <summary>
    /// 上傳者 ID 過濾
    /// </summary>
    public Guid? UploadedBy { get; set; }

    /// <summary>
    /// 文件類型過濾（擴展名）
    /// </summary>
    public string? FileExtension { get; set; }

    /// <summary>
    /// 文件種類過濾 (image, video, document, etc.)
    /// </summary>
    public string? FileType { get; set; }

    /// <summary>
    /// 父資料夾 ID
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// 是否僅查詢根目錄
    /// </summary>
    public bool? IsRoot { get; set; }

    /// <summary>
    /// 頁碼
    /// </summary>
    public int PageIndex { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;
}
