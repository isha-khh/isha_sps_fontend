using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 背景壓縮服務的設定（appsettings 的 <c>ImageOptimization</c> 區段，或環境變數 <c>ImageOptimization__Enabled</c> 等）。
/// </summary>
public class ImageOptimizationOptions
{
    public const string SectionName = "ImageOptimization";

    /// <summary>是否啟用。預設關閉，避免部署新版就開始大量處理檔案；要用時先開 <see cref="DryRun"/> 看預估再正式跑。</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>試算模式：只計算會轉哪些檔、預計省多少並寫進日誌，不改任何檔案與資料庫。跑完整輪後服務就停止。</summary>
    public bool DryRun { get; set; } = false;

    /// <summary>每一批處理幾個檔案</summary>
    public int BatchSize { get; set; } = 20;

    /// <summary>每批之間暫停幾秒（讓出 CPU 與磁碟給正常的網站流量）</summary>
    public int PauseSeconds { get; set; } = 5;

    /// <summary>全部處理完之後，隔幾小時再掃一次有沒有新的未處理圖片</summary>
    public int RescanHours { get; set; } = 6;

    /// <summary>啟動後先等幾秒才開始，避免跟網站啟動時的初始化搶資源</summary>
    public int StartupDelaySeconds { get; set; } = 60;

    /// <summary>只在台北時間的這個時段內執行（離峰時段）；兩個值相同代表不限時段。預設凌晨 1 點到 6 點。</summary>
    public int WindowStartHour { get; set; } = 1;

    public int WindowEndHour { get; set; } = 6;

    /// <summary>被取代的原檔是否保留（搬到儲存根目錄下的 <see cref="ArchiveFolder"/>）。確認沒問題後再手動刪掉那個資料夾即可。</summary>
    public bool KeepOriginals { get; set; } = true;

    /// <summary>備份原檔的資料夾名稱（在檔案儲存根目錄底下，保留原本的相對路徑）</summary>
    public string ArchiveFolder { get; set; } = "_originals";
}

/// <summary>
/// 背景壓縮服務：在離峰時段慢慢把「還沒評估過」的既有圖片（JPG／PNG／BMP，以及超過尺寸上限的 WebP）
/// 原地轉成 WebP——檔案 ID 與下載網址不變，所以不用改任何引用。
/// 不處理：申請文件（標籤含 application，保留原檔）、靜態檔案（wwwroot，啟動時會用雜湊比對）、資料夾、已刪除的檔案。
/// 原檔預設搬到備份資料夾而不是直接刪除。上傳當下已經轉檔的新圖（<c>ImageOptimizedAt</c> 有值）不會再處理。
/// </summary>
public class ImageOptimizationBackgroundService : BackgroundService
{
    private static readonly string[] Extensions = { ".jpg", ".jpeg", ".png", ".bmp", ".webp" };

    private readonly IServiceProvider _services;
    private readonly IOptionsMonitor<ImageOptimizationOptions> _options;
    private readonly ILogger<ImageOptimizationBackgroundService> _logger;

    public ImageOptimizationBackgroundService(
        IServiceProvider services,
        IOptionsMonitor<ImageOptimizationOptions> options,
        ILogger<ImageOptimizationBackgroundService> logger)
    {
        _services = services;
        _options = options;
        _logger = logger;
    }

    private sealed class Totals
    {
        public int Converted;
        public int KeptOriginal;
        public int Failed;
        public long SavedBytes;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = _options.CurrentValue;
        if (!options.Enabled)
        {
            _logger.LogInformation("圖片背景壓縮服務未啟用（ImageOptimization:Enabled=false）");
            return;
        }

        _logger.LogInformation(
            "圖片背景壓縮服務啟動：{Mode}，每批 {Batch} 個，台北時間 {Start}:00–{End}:00，原檔{Keep}",
            options.DryRun ? "試算模式（不改任何東西）" : "正式處理", options.BatchSize, options.WindowStartHour, options.WindowEndHour,
            options.KeepOriginals ? $"搬到 {options.ArchiveFolder}" : "直接刪除");

        try
        {
            await Task.Delay(TimeSpan.FromSeconds(Math.Max(0, options.StartupDelaySeconds)), stoppingToken);

            var seen = new HashSet<Guid>();
            var totals = new Totals();
            while (!stoppingToken.IsCancellationRequested)
            {
                options = _options.CurrentValue;
                if (!options.Enabled) return;

                if (!InWindow(options))
                {
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    continue;
                }

                var handled = await RunBatchAsync(options, seen, totals, stoppingToken);
                if (handled > 0)
                {
                    await Task.Delay(TimeSpan.FromSeconds(Math.Max(0, options.PauseSeconds)), stoppingToken);
                    continue;
                }

                _logger.LogInformation(
                    "圖片背景壓縮：這一輪處理完畢——轉成 WebP {Converted} 個、維持原檔 {Kept} 個、失敗 {Failed} 個，{Mode}共省 {Saved:F1} MB",
                    totals.Converted, totals.KeptOriginal, totals.Failed, options.DryRun ? "預估" : "實際", totals.SavedBytes / 1048576.0);

                if (options.DryRun) return; // 試算只跑一輪

                seen.Clear();
                totals = new Totals();
                await Task.Delay(TimeSpan.FromHours(Math.Max(1, options.RescanHours)), stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // 網站關閉
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "圖片背景壓縮服務發生未預期的錯誤，已停止（重啟網站後會再試）");
        }
    }

    private static bool InWindow(ImageOptimizationOptions options)
    {
        if (options.WindowStartHour == options.WindowEndHour) return true;
        TimeZoneInfo tz;
        try { tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Taipei"); }
        catch { tz = TimeZoneInfo.CreateCustomTimeZone("TW", TimeSpan.FromHours(8), "TW", "TW"); }
        var hour = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Hour;
        return options.WindowStartHour < options.WindowEndHour
            ? hour >= options.WindowStartHour && hour < options.WindowEndHour
            : hour >= options.WindowStartHour || hour < options.WindowEndHour; // 跨午夜，例如 22–4
    }

    /// <summary>處理一批，回傳這批實際處理了幾個檔案（0 ＝ 沒有待處理的了）。</summary>
    private async Task<int> RunBatchAsync(ImageOptimizationOptions options, HashSet<Guid> seen, Totals totals, CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageProvider>();
        var optimizer = scope.ServiceProvider.GetRequiredService<IImageOptimizer>();

        var seenIds = seen.ToList();
        var batch = await db.UploadedFiles
            .Where(f => !f.IsFolder && !f.IsStaticFile && f.Status != FileStatus.Deleted && f.ImageOptimizedAt == null
                        && Extensions.Contains(f.FileExtension)
                        && !(f.Tags ?? "").Contains("application")
                        && !seenIds.Contains(f.Id))
            .OrderBy(f => f.CreatedTime)
            .Take(Math.Max(1, options.BatchSize))
            .ToListAsync(ct);

        foreach (var file in batch)
        {
            ct.ThrowIfCancellationRequested();
            seen.Add(file.Id);
            try
            {
                using var source = new MemoryStream();
                await using (var read = await storage.ReadFileAsync(file.StoragePath, ct))
                {
                    await read.CopyToAsync(source, ct);
                }

                source.Position = 0;
                // 解碼與編碼是同步的 CPU 運算，放到背景執行緒
                var optimized = await Task.Run(() => optimizer.TryOptimize(source, $"image{file.FileExtension}"), ct);
                if (optimized == null)
                {
                    totals.KeptOriginal++;
                    if (!options.DryRun)
                    {
                        file.ImageOptimizedAt = DateTime.UtcNow;
                        await db.SaveChangesAsync(ct);
                    }
                    continue;
                }

                await using var optimizedData = optimized.Data;
                var saved = file.FileSize - optimized.Length;
                totals.Converted++;
                totals.SavedBytes += saved;

                if (options.DryRun)
                {
                    _logger.LogInformation("[試算] {File} {Old:F0}KB → {New:F0}KB（{W}×{H}{Resized}）",
                        file.OriginalFileName, file.FileSize / 1024.0, optimized.Length / 1024.0, optimized.Width, optimized.Height, optimized.Resized ? "，縮小" : "");
                    continue;
                }

                var oldPath = file.StoragePath;
                var (newPath, newHash) = await storage.SaveFileAsync(optimized.Data, optimized.FileName, ct);
                try
                {
                    file.StoragePath = newPath;
                    file.StoredFileName = Path.GetFileName(newPath);
                    file.FileExtension = ".webp";
                    file.ContentType = optimized.ContentType;
                    file.FileSize = optimized.Length;
                    file.FileHash = newHash;
                    if (!string.IsNullOrWhiteSpace(file.OriginalFileName))
                        file.OriginalFileName = Path.ChangeExtension(file.OriginalFileName, ".webp");
                    file.UpdatedTime = DateTime.UtcNow;
                    file.ImageOptimizedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync(ct);
                }
                catch
                {
                    // 資料庫沒更新成功：把剛寫的新檔清掉，原檔與資料庫維持原狀
                    await storage.DeleteFileAsync(newPath, CancellationToken.None);
                    throw;
                }

                // 資料庫已指向新檔，才處理舊檔（失敗只記警告，不影響結果）
                try
                {
                    if (options.KeepOriginals) await storage.ArchiveFileAsync(oldPath, options.ArchiveFolder, ct);
                    else await storage.DeleteFileAsync(oldPath, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "圖片已轉成 WebP，但舊檔處理失敗（檔案還留在原處）：{Path}", oldPath);
                }

                _logger.LogInformation("圖片已轉成 WebP：{File} {Old:F0}KB → {New:F0}KB（{W}×{H}{Resized}）",
                    file.OriginalFileName, (file.FileSize + saved) / 1024.0, file.FileSize / 1024.0, optimized.Width, optimized.Height, optimized.Resized ? "，縮小" : "");
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                totals.Failed++;
                _logger.LogWarning(ex, "圖片背景壓縮失敗，跳過這個檔案（下次啟動會再試）：{Id} {Path}", file.Id, file.StoragePath);
                db.ChangeTracker.Clear();
            }
        }

        return batch.Count;
    }
}
