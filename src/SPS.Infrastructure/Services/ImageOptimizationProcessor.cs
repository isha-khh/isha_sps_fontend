using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>一輪壓縮的累計結果（背景服務與後台「壓縮所有圖片」任務共用）。</summary>
public sealed class ImageOptimizationTotals
{
    public int Converted;
    public int KeptOriginal;
    /// <summary>處理時丟了例外的（解碼、寫檔、資料庫…）；不會被標記，下次執行會再試</summary>
    public int Failed;
    /// <summary>資料庫有這筆紀錄、磁碟上卻沒有實體檔案（<see cref="FileNotFoundException"/>）。不是壓縮的問題，是舊資料
    /// （例如資料庫是從別處複製、上傳檔案沒跟著來），所以另外計、不算失敗，也不會被一直重試</summary>
    public int Missing;
    public long SavedBytes;

    public int Processed => Converted + KeptOriginal + Failed + Missing;
}

/// <summary>
/// 既有圖片「原地轉 WebP」的共用處理器：檔案 ID 與下載網址不變，所以不用改任何引用。
/// 背景離峰服務與後台手動任務都透過這裡處理，並共用同一把鎖，避免兩邊同時處理同一個檔案。
/// 不處理：申請文件（標籤含 application，保留原檔）、靜態檔案（wwwroot，啟動時會用雜湊比對）、資料夾、已刪除的檔案。
/// </summary>
public sealed class ImageOptimizationProcessor
{
    private static readonly string[] Extensions = { ".jpg", ".jpeg", ".png", ".bmp", ".webp" };

    private readonly IServiceProvider _services;
    private readonly ILogger<ImageOptimizationProcessor> _logger;

    /// <summary>同一時間只允許一批在處理（背景服務與手動任務輪流取用）</summary>
    public SemaphoreSlim Gate { get; } = new(1, 1);

    public ImageOptimizationProcessor(IServiceProvider services, ILogger<ImageOptimizationProcessor> logger)
    {
        _services = services;
        _logger = logger;
    }

    private static IQueryable<UploadedFile> Pending(ApplicationDbContext db) =>
        db.UploadedFiles.Where(f => !f.IsFolder && !f.IsStaticFile && f.Status != FileStatus.Deleted && f.ImageOptimizedAt == null
                                    && Extensions.Contains(f.FileExtension)
                                    && !(f.Tags ?? "").Contains("application"));

    /// <summary>還沒評估過、等著被處理的圖片數量</summary>
    public async Task<int> CountPendingAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await Pending(db).CountAsync(ct);
    }

    /// <summary>處理一批，回傳這批實際處理了幾個檔案（0 ＝ 沒有待處理的了）。</summary>
    public async Task<int> RunBatchAsync(
        int batchSize, bool dryRun, bool keepOriginals, string archiveFolder,
        HashSet<Guid> seen, ImageOptimizationTotals totals, CancellationToken ct)
    {
        await Gate.WaitAsync(ct);
        try
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var storage = scope.ServiceProvider.GetRequiredService<IFileStorageProvider>();
            var optimizer = scope.ServiceProvider.GetRequiredService<IImageOptimizer>();

            var seenIds = seen.ToList();
            var batch = await Pending(db)
                .Where(f => !seenIds.Contains(f.Id))
                .OrderBy(f => f.CreatedTime)
                .Take(Math.Max(1, batchSize))
                .ToListAsync(ct);

            foreach (var file in batch)
            {
                ct.ThrowIfCancellationRequested();
                seen.Add(file.Id);
                try
                {
                    await ProcessFileAsync(file, db, storage, optimizer, dryRun, keepOriginals, archiveFolder, totals, ct);
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex) when (ex is FileNotFoundException or DirectoryNotFoundException)
                {
                    // 檔案不見了：重試也不會變出檔案，所以標記成「已評估」，不再出現在待處理數字裡、也不會每次都報一次失敗。
                    // 標記的是「評估過、沒有東西可處理」；之後若把檔案補回磁碟，要重新壓縮就把該筆的 ImageOptimizedAt 清成 null
                    totals.Missing++;
                    _logger.LogWarning("圖片壓縮：資料庫有紀錄但磁碟上找不到檔案，已略過並標記為已評估：{Id} {Path}", file.Id, file.StoragePath);
                    if (!dryRun)
                    {
                        try
                        {
                            file.ImageOptimizedAt = DateTime.UtcNow;
                            await db.SaveChangesAsync(ct);
                        }
                        catch (Exception markEx) when (markEx is not OperationCanceledException)
                        {
                            _logger.LogWarning(markEx, "標記遺失檔案失敗：{Id}", file.Id);
                            db.ChangeTracker.Clear();
                        }
                    }
                }
                catch (Exception ex)
                {
                    totals.Failed++;
                    _logger.LogWarning(ex, "圖片壓縮失敗，跳過這個檔案（下次執行會再試）：{Id} {Path}", file.Id, file.StoragePath);
                    db.ChangeTracker.Clear();
                }
            }

            return batch.Count;
        }
        finally
        {
            Gate.Release();
        }
    }

    private async Task ProcessFileAsync(
        UploadedFile file, ApplicationDbContext db, IFileStorageProvider storage, IImageOptimizer optimizer,
        bool dryRun, bool keepOriginals, string archiveFolder, ImageOptimizationTotals totals, CancellationToken ct)
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
            if (!dryRun)
            {
                file.ImageOptimizedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
            }
            return;
        }

        await using var optimizedData = optimized.Data;
        var saved = file.FileSize - optimized.Length;

        if (dryRun)
        {
            totals.Converted++;
            totals.SavedBytes += saved;
            _logger.LogInformation("[試算] {File} {Old:F0}KB → {New:F0}KB（{W}×{H}{Resized}）",
                file.OriginalFileName, file.FileSize / 1024.0, optimized.Length / 1024.0, optimized.Width, optimized.Height, optimized.Resized ? "，縮小" : "");
            return;
        }

        var oldPath = file.StoragePath;
        var oldSize = file.FileSize;
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
            // 寫入成功才計入（取消或失敗時不會多算）
            totals.Converted++;
            totals.SavedBytes += saved;
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
            if (keepOriginals) await storage.ArchiveFileAsync(oldPath, archiveFolder, ct);
            else await storage.DeleteFileAsync(oldPath, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "圖片已轉成 WebP，但舊檔處理失敗（檔案還留在原處）：{Path}", oldPath);
        }

        _logger.LogInformation("圖片已轉成 WebP：{File} {Old:F0}KB → {New:F0}KB（{W}×{H}{Resized}）",
            file.OriginalFileName, oldSize / 1024.0, file.FileSize / 1024.0, optimized.Width, optimized.Height, optimized.Resized ? "，縮小" : "");
    }
}
