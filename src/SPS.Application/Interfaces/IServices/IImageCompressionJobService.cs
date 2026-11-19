namespace SPS.Application.Interfaces.IServices;

/// <summary>後台「壓縮所有圖片」任務的狀態快照</summary>
public class ImageCompressionJobDto
{
    public Guid Id { get; set; }

    /// <summary>Queued／Running／Completed／Failed／Cancelled</summary>
    public string Status { get; set; } = "Queued";

    /// <summary>開始處理時待處理的圖片總數（排隊中為 0）</summary>
    public int Total { get; set; }

    /// <summary>已處理數（轉檔 + 維持原檔 + 失敗）</summary>
    public int Processed { get; set; }

    public int Converted { get; set; }
    public int KeptOriginal { get; set; }
    public int Failed { get; set; }

    /// <summary>資料庫有紀錄但磁碟上找不到檔案的數量（已略過並標記為已評估，不算失敗）</summary>
    public int Missing { get; set; }

    /// <summary>已省下的容量（bytes）</summary>
    public long SavedBytes { get; set; }

    public string? RequestedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? Error { get; set; }
}

public class ImageCompressionStatusDto
{
    /// <summary>目前還沒壓縮過的圖片數</summary>
    public int PendingCount { get; set; }

    /// <summary>最近一次（或進行中）的任務；伺服器重啟後為 null</summary>
    public ImageCompressionJobDto? Job { get; set; }
}

public class ImageCompressionEnqueueResult
{
    public ImageCompressionJobDto Job { get; set; } = new();

    /// <summary>true ＝ 已經有任務在排隊或執行中，回傳的是那個任務（沒有重複建立）</summary>
    public bool AlreadyActive { get; set; }
}

/// <summary>
/// 後台手動「壓縮所有圖片」：任務進佇列、由背景工作逐批處理，進度即時推給後台鈴鐺（<see cref="IAdminRealtimeNotifier"/>，需要「檔案管理」權限），
/// 結束時寫一則「系統」通知給啟動的人。
/// 任務狀態存在記憶體；伺服器重啟會中斷，但已處理的檔案都有標記，再按一次會從剩下的接續。
/// </summary>
public interface IImageCompressionJobService
{
    /// <param name="requestedBy">顯示用的啟動者名稱</param>
    /// <param name="recipient">結束通知的收件人（後台使用者 Id，鈴鐺依這個撈）；null 就不寫通知</param>
    Task<ImageCompressionEnqueueResult> EnqueueAsync(string? requestedBy, string? recipient, CancellationToken ct);
    Task<ImageCompressionStatusDto> GetStatusAsync(CancellationToken ct);
    bool Cancel(Guid jobId);
}
