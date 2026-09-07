using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces;

namespace SPS.Application.Services;

/// <summary>
/// 檔案清理背景服務
/// 每日自動清理超過保存期限的申請文件
/// </summary>
public class FileCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<FileCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24); // 每24小時執行一次

    public FileCleanupService(
        IServiceProvider serviceProvider,
        ILogger<FileCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("FileCleanupService is starting.");

        // 等待第一次執行時間（設定為每天凌晨2點）
        await WaitForNextScheduledTime(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("FileCleanupService is running at: {time}", DateTimeOffset.Now);

                await PerformCleanupAsync(stoppingToken);

                _logger.LogInformation("FileCleanupService completed at: {time}", DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing FileCleanupService.");
            }

            // 等待下一次執行時間
            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("FileCleanupService is stopping.");
    }

    private async Task WaitForNextScheduledTime(CancellationToken stoppingToken)
    {
        var now = DateTime.Now;
        var nextRunTime = now.Date.AddDays(1).AddHours(2); // 明天凌晨2點

        if (now.Hour < 2)
        {
            // 如果現在時間還沒到今天凌晨2點，則設定為今天凌晨2點
            nextRunTime = now.Date.AddHours(2);
        }

        var delay = nextRunTime - now;
        _logger.LogInformation("FileCleanupService will start at: {time}", nextRunTime);

        await Task.Delay(delay, stoppingToken);
    }

    private async Task PerformCleanupAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var fileStorageProvider = scope.ServiceProvider.GetRequiredService<IFileStorageProvider>();

        try
        {
            var deletedCount = 0;

            // 使用倉儲查詢需要清理的文件
            var documentsToDelete = await unitOfWork.ApplicationDocuments
                .GetDocumentsForCleanupAsync(stoppingToken);

            foreach (var document in documentsToDelete)
            {
                try
                {
                    // 刪除實體檔案
                    string? storagePath = null;

                    // 優先使用 UploadedFile 的 StoragePath，否則使用 ApplicationDocument 的 FilePath
                    if (document.UploadedFile != null && !string.IsNullOrEmpty(document.UploadedFile.StoragePath))
                    {
                        storagePath = document.UploadedFile.StoragePath;
                    }
                    else if (!string.IsNullOrEmpty(document.FilePath))
                    {
                        storagePath = document.FilePath;
                    }

                    if (!string.IsNullOrEmpty(storagePath))
                    {
                        if (fileStorageProvider.FileExists(storagePath))
                        {
                            await fileStorageProvider.DeleteFileAsync(storagePath, stoppingToken);
                            _logger.LogInformation("Deleted file: {filePath}", storagePath);
                        }
                    }

                    // 從資料庫刪除記錄
                    await unitOfWork.ApplicationDocuments.DeleteAsync(document, stoppingToken);
                    deletedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete document {documentId}: {error}",
                        document.Id, ex.Message);
                }
            }

            await unitOfWork.SaveChangesAsync(stoppingToken);

            _logger.LogInformation("File cleanup completed. Deleted {count} files.", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during file cleanup: {error}", ex.Message);
        }
    }
}