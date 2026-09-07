using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 靜態檔案掃描背景服務
/// 在系統啟動時自動掃描 wwwroot 目錄
/// </summary>
public class StaticFileScannerService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<StaticFileScannerService> _logger;

    public StaticFileScannerService(
        IServiceProvider serviceProvider,
        ILogger<StaticFileScannerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "靜態檔案掃描時發生錯誤");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
