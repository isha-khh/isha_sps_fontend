using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services;
using System.Security.Cryptography;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 靜態檔案掃描背景服務
/// 在系統啟動時自動掃描 wwwroot 目錄
/// </summary>
public class StaticFileScannerService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<StaticFileScannerService> _logger;
    private readonly IWebHostEnvironment _environment;

    public StaticFileScannerService(
        IServiceProvider serviceProvider,
        ILogger<StaticFileScannerService> logger,
        IWebHostEnvironment environment)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// 把程式內建的 seed 檔案（應用程式目錄下 wwwroot/seed）同步到實際的 WebRoot/seed。
    /// 平常兩者是同一個目錄，什麼都不用做；但部署時 WebRoot 可能被指到別的目錄（例如 docker 掛載的主機目錄，
    /// <c>ASPNETCORE_WEBROOT</c>），這時映像裡的 seed 檔案不在 WebRoot 底下，後面的掃描與 seed 就找不到。
    /// 只複製缺少或內容不同的檔案，略過 . 開頭的隱藏檔；失敗只記警告，不影響啟動。
    /// </summary>
    private void SyncSeedFiles()
    {
        try
        {
            var source = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "wwwroot", "seed"));
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot) || !Directory.Exists(source)) return;

            var target = Path.GetFullPath(Path.Combine(webRoot, "seed"));
            if (string.Equals(source, target, StringComparison.Ordinal)) return;

            var copied = 0;
            foreach (var file in Directory.EnumerateFiles(source, "*", SearchOption.AllDirectories))
            {
                var relative = Path.GetRelativePath(source, file);
                if (relative.Split(Path.DirectorySeparatorChar).Any(part => part.StartsWith('.'))) continue;

                var destination = Path.Combine(target, relative);
                if (File.Exists(destination) && FileHash(destination) == FileHash(file)) continue;

                Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
                File.Copy(file, destination, overwrite: true);
                copied++;
            }

            if (copied > 0)
                _logger.LogInformation("WebRoot 與應用程式內建 wwwroot 不同，已把 {Count} 個 seed 檔案同步到 {Target}", copied, target);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "同步 seed 檔案到 WebRoot 失敗，seed 內容可能不會套用");
        }
    }

    private static string FileHash(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream));
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        SyncSeedFiles();
        _logger.LogInformation("開始掃描 wwwroot 靜態檔案...");

        try
        {
            // 使用 Scope 來取得 Scoped 服務
            using var scope = _serviceProvider.CreateScope();
            var fileManagementService = scope.ServiceProvider.GetRequiredService<IFileManagementService>();

            var result = await fileManagementService.ScanStaticFilesAsync(cancellationToken);

            if (result.IsSuccess && result.Data != null)
            {
                _logger.LogInformation(
                    "靜態檔案掃描完成: 掃描 {Scanned} 個檔案, 新增 {Added} 個, 已存在 {Existing} 個, 失敗 {Failed} 個",
                    result.Data.ScannedCount,
                    result.Data.AddedCount,
                    result.Data.ExistingCount,
                    result.Data.FailedItems.Count);
            }
            else
            {
                _logger.LogWarning("靜態檔案掃描失敗: {Error}", result.Error);
            }

            // 掃描完才 seed：seed 檔案要先被登錄成靜態檔案才有 id 可以設定（見 ContributeFormatSeeder）
            await scope.ServiceProvider.GetRequiredService<ContributeFormatSeeder>().SeedAsync(cancellationToken);
            await scope.ServiceProvider.GetRequiredService<DownloadResourceSeeder>().SeedAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "靜態檔案掃描或 seed 時發生錯誤");
        }

        try
        {
            // 企業標籤的初始資料（資料庫沒有任何企業標籤時才匯入）；跟檔案無關，但這裡是目前唯一的啟動 seed 入口
            using var tagScope = _serviceProvider.CreateScope();
            await tagScope.ServiceProvider.GetRequiredService<CompanyTagSeeder>().SeedAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "匯入內建企業標籤時發生錯誤");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
