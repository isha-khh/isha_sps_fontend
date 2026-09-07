namespace SPS.Application.DTOs.File;

public class CreateFolderRequest
{
    public string FolderName { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}

public class CreateFileRequest
{
    public string FileName { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}

public class RenameFileRequest
{
    public string NewName { get; set; } = string.Empty;
}

public class MoveFileRequest
{
    public Guid? TargetParentId { get; set; }
}

public class CopyFileRequest
{
    public Guid? TargetParentId { get; set; }
}

/// <summary>
/// 批量刪除請求
/// </summary>
public class BatchDeleteRequest
{
    /// <summary>
    /// 要刪除的文件 ID 列表
    /// </summary>
    public List<Guid> FileIds { get; set; } = new();

    /// <summary>
    /// 是否永久刪除（硬刪除）
    /// </summary>
    public bool Permanent { get; set; } = false;
}

/// <summary>
/// 批量移動請求
/// </summary>
public class BatchMoveRequest
{
    /// <summary>
    /// 要移動的文件 ID 列表
    /// </summary>
    public List<Guid> FileIds { get; set; } = new();

    /// <summary>
    /// 目標父資料夾 ID（null 表示根目錄）
    /// </summary>
    public Guid? TargetParentId { get; set; }
}

/// <summary>
/// 批量複製請求
/// </summary>
public class BatchCopyRequest
{
    /// <summary>
    /// 要複製的文件 ID 列表
    /// </summary>
    public List<Guid> FileIds { get; set; } = new();

    /// <summary>
    /// 目標父資料夾 ID（null 表示根目錄）
    /// </summary>
    public Guid? TargetParentId { get; set; }
}

/// <summary>
/// 批量還原請求
/// </summary>
public class BatchRestoreRequest
{
    /// <summary>
    /// 要還原的文件 ID 列表
    /// </summary>
    public List<Guid> FileIds { get; set; } = new();
}

/// <summary>
/// 批量操作任務響應
/// </summary>
public class BatchOperationResponse
{
    /// <summary>
    /// 任務 ID
    /// </summary>
    public string TaskId { get; set; } = string.Empty;

    /// <summary>
    /// 任務狀態
    /// </summary>
    public BatchOperationStatus Status { get; set; }

    /// <summary>
    /// 總數量
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 已處理數量
    /// </summary>
    public int ProcessedCount { get; set; }

    /// <summary>
    /// 成功數量
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// 失敗數量
    /// </summary>
    public int FailureCount { get; set; }

    /// <summary>
    /// 進度百分比 (0-100)
    /// </summary>
    public double ProgressPercentage => TotalCount > 0 ? (double)ProcessedCount / TotalCount * 100 : 0;

    /// <summary>
    /// 開始時間
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// 完成時間
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 失敗項目列表
    /// </summary>
    public List<BatchOperationFailedItem> FailedItems { get; set; } = new();

    /// <summary>
    /// 成功創建的文件（用於複製操作）
    /// </summary>
    public List<FileInfoResponse>? CreatedFiles { get; set; }
}

/// <summary>
/// 批量操作失敗項目
/// </summary>
public class BatchOperationFailedItem
{
    /// <summary>
    /// 文件 ID
    /// </summary>
    public Guid FileId { get; set; }

    /// <summary>
    /// 文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 錯誤信息
    /// </summary>
    public string ErrorMessage { get; set; } = string.Empty;
}

/// <summary>
/// 批量操作狀態
/// </summary>
public enum BatchOperationStatus
{
    /// <summary>
    /// 進行中
    /// </summary>
    InProgress,

    /// <summary>
    /// 已完成
    /// </summary>
    Completed,

    /// <summary>
    /// 部分失敗
    /// </summary>
    PartiallyCompleted,

    /// <summary>
    /// 全部失敗
    /// </summary>
    Failed,

    /// <summary>
    /// 已取消
    /// </summary>
    Cancelled
}

/// <summary>
/// 掃描靜態檔案回應
/// </summary>
public class ScanStaticFilesResponse
{
    /// <summary>
    /// 掃描到的檔案數量
    /// </summary>
    public int ScannedCount { get; set; }

    /// <summary>
    /// 新增的檔案數量
    /// </summary>
    public int AddedCount { get; set; }

    /// <summary>
    /// 已存在的檔案數量
    /// </summary>
    public int ExistingCount { get; set; }

    /// <summary>
    /// 掃描失敗的檔案
    /// </summary>
    public List<ScanFailedItem> FailedItems { get; set; } = new();

    /// <summary>
    /// 掃描時間
    /// </summary>
    public DateTime ScannedAt { get; set; }
}

/// <summary>
/// 掃描失敗項目
/// </summary>
public class ScanFailedItem
{
    /// <summary>
    /// 檔案路徑
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// 錯誤訊息
    /// </summary>
    public string ErrorMessage { get; set; } = string.Empty;
}

/// <summary>
/// 靜態檔案列表項目回應
/// </summary>
public class StaticFileListItemResponse
{
    /// <summary>
    /// 檔案 ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 檔案編號
    /// </summary>
    public string FileNumber { get; set; } = string.Empty;

    /// <summary>
    /// 原始檔案名稱
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// 靜態檔案相對路徑
    /// </summary>
    public string StaticFilePath { get; set; } = string.Empty;

    /// <summary>
    /// 副檔名
    /// </summary>
    public string FileExtension { get; set; } = string.Empty;

    /// <summary>
    /// 檔案大小
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 格式化的檔案大小
    /// </summary>
    public string FormattedFileSize { get; set; } = string.Empty;

    /// <summary>
    /// MIME 類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 檔案狀態
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 是否已刪除
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// 刪除時間
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 公開存取 URL
    /// </summary>
    public string PublicUrl { get; set; } = string.Empty;
}

/// <summary>
/// 查詢靜態檔案請求
/// </summary>
public class StaticFileQueryRequest
{
    /// <summary>
    /// 關鍵字搜尋
    /// </summary>
    public string? Keyword { get; set; }

    /// <summary>
    /// 是否包含已刪除的檔案
    /// </summary>
    public bool IncludeDeleted { get; set; } = false;

    /// <summary>
    /// 只顯示已刪除的檔案
    /// </summary>
    public bool OnlyDeleted { get; set; } = false;

    /// <summary>
    /// 副檔名過濾
    /// </summary>
    public string? FileExtension { get; set; }

    /// <summary>
    /// 頁碼（從 1 開始）
    /// </summary>
    public int PageIndex { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;
}
