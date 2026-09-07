namespace SPS.Application.DTOs.File;

/// <summary>
/// 文件上傳響應
/// </summary>
public class FileUploadResponse
{
    /// <summary>
    /// 文件 ID
    /// </summary>
    public Guid FileId { get; set; }

    /// <summary>
    /// 文件編號
    /// </summary>
    public string FileNumber { get; set; } = string.Empty;

    /// <summary>
    /// 原始文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件訪問 URL（相對路徑）
    /// </summary>
    public string FileUrl { get; set; } = string.Empty;

    /// <summary>
    /// 文件哈希值
    /// </summary>
    public string FileHash { get; set; } = string.Empty;

    /// <summary>
    /// 上傳時間
    /// </summary>
    public DateTime UploadedAt { get; set; }
}

/// <summary>
/// 批量文件上傳響應
/// </summary>
public class BatchFileUploadResponse
{
    /// <summary>
    /// 總文件數
    /// </summary>
    public int TotalFiles { get; set; }

    /// <summary>
    /// 成功上傳數
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// 失敗數
    /// </summary>
    public int FailureCount { get; set; }

    /// <summary>
    /// 上傳成功的文件列表
    /// </summary>
    public List<FileUploadResponse> UploadedFiles { get; set; } = new();

    /// <summary>
    /// 失敗的文件列表
    /// </summary>
    public List<FailedFileUpload> FailedFiles { get; set; } = new();
}

/// <summary>
/// 上傳失敗的文件信息
/// </summary>
public class FailedFileUpload
{
    /// <summary>
    /// 文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 失敗原因
    /// </summary>
    public string ErrorMessage { get; set; } = string.Empty;
}
