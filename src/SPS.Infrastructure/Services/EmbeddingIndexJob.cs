using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// IEmbeddingIndexJob 的單例實作：保存背景索引的進度，並讓 API 能喚醒背景服務。
/// 狀態只存在記憶體，後端重啟後歸零（進度本身可由資料庫的索引筆數重新算出）。
/// </summary>
public class EmbeddingIndexJob : IEmbeddingIndexJob
{
    private readonly object _lock = new();
    private readonly SemaphoreSlim _wake = new(0, int.MaxValue);

    private string _phase = "idle";
    private bool _reindexQueued;
    private int _reindexTotal;
    private int _reindexProcessed;
    private int _reindexFailed;
    private DateTime? _reindexStartedAt;
    private DateTime? _reindexFinishedAt;
    private DateTime? _lastScanAt;
    private int _lastScanProcessed;
    private DateTime? _nextScanAt;
    private string? _lastError;

    public EmbeddingIndexJobDto GetSnapshot()
    {
        lock (_lock)
        {
            return new EmbeddingIndexJobDto
            {
                Phase = _phase,
                ReindexQueued = _reindexQueued,
                ReindexTotal = _reindexTotal,
                ReindexProcessed = _reindexProcessed,
                ReindexFailed = _reindexFailed,
                ReindexStartedAt = _reindexStartedAt,
                ReindexFinishedAt = _reindexFinishedAt,
                LastScanAt = _lastScanAt,
                LastScanProcessed = _lastScanProcessed,
                NextScanAt = _nextScanAt,
                LastError = _lastError,
            };
        }
    }

    public bool RequestFullReindex()
    {
        lock (_lock)
        {
            if (_reindexQueued || _phase == "reindexing") return false;
            _reindexQueued = true;
            _reindexTotal = 0;
            _reindexProcessed = 0;
            _reindexFailed = 0;
            _reindexStartedAt = null;
            _reindexFinishedAt = null;
        }
        _wake.Release();
        return true;
    }

    public void RequestScan() => _wake.Release();

    // ---- 以下給背景服務使用 ----

    /// <summary>
    /// 等到間隔結束或被喚醒。回傳 true 表示是被喚醒的。
    /// </summary>
    public async Task<bool> WaitAsync(TimeSpan interval, CancellationToken ct)
    {
        lock (_lock) _nextScanAt = DateTime.UtcNow + interval;
        var woken = await _wake.WaitAsync(interval, ct);
        // 吃掉同一時間累積的多次喚醒，避免連跑好幾輪
        while (_wake.CurrentCount > 0 && await _wake.WaitAsync(0, ct)) { }
        return woken;
    }

    public bool TakeReindexRequest()
    {
        lock (_lock)
        {
            if (!_reindexQueued) return false;
            _reindexQueued = false;
            return true;
        }
    }

    public void BeginReindex(int total)
    {
        lock (_lock)
        {
            _phase = "reindexing";
            _reindexTotal = total;
            _reindexProcessed = 0;
            _reindexFailed = 0;
            _reindexStartedAt = DateTime.UtcNow;
            _reindexFinishedAt = null;
            _lastError = null;
        }
    }

    public void AdvanceReindex(bool success)
    {
        lock (_lock)
        {
            _reindexProcessed++;
            if (!success) _reindexFailed++;
        }
    }

    public void EndReindex()
    {
        lock (_lock)
        {
            _phase = "idle";
            _reindexFinishedAt = DateTime.UtcNow;
        }
    }

    public void BeginScan()
    {
        lock (_lock) _phase = "scanning";
    }

    public void EndScan(int processed)
    {
        lock (_lock)
        {
            _phase = "idle";
            _lastScanAt = DateTime.UtcNow;
            _lastScanProcessed = processed;
        }
    }

    public void SetError(string? error)
    {
        lock (_lock)
        {
            _lastError = error;
            if (_phase != "idle")
            {
                _phase = "idle";
                if (_reindexStartedAt != null && _reindexFinishedAt == null) _reindexFinishedAt = DateTime.UtcNow;
            }
        }
    }
}
