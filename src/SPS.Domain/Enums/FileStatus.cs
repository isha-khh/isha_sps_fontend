namespace SPS.Domain.Enums;

/// <summary>
/// 文件狀態枚舉
/// </summary>
public enum FileStatus
{
    /// <summary>
    /// 活躍狀態，可正常訪問
    /// </summary>
    Active = 1,

    /// <summary>
    /// 已刪除（軟刪除）
    /// </summary>
    Deleted = 2,

    /// <summary>
    /// 已歸檔
    /// </summary>
    Archived = 3,

    /// <summary>
    /// 上傳中
    /// </summary>
    Uploading = 4,

    /// <summary>
    /// 上傳失敗
    /// </summary>
    UploadFailed = 5
}
