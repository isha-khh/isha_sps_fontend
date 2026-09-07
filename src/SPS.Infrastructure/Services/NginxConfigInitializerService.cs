using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 應用程式啟動時自動產生 Nginx 設定檔，確保 nginx 有初始 config
/// </summary>
public class NginxConfigInitializerService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NginxConfigInitializerService> _logger;

    public NginxConfigInitializerService(
        IServiceScopeFactory scopeFactory,
        ILogger<NginxConfigInitializerService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var configPath = Environment.GetEnvironmentVariable("SecuritySettings__NginxConfigPath");
        if (string.IsNullOrEmpty(configPath))
        {
            _logger.LogDebug("NginxConfigInitializer: SecuritySettings__NginxConfigPath not set, skipping");
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();

            var result = await settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity", cancellationToken);
            var settings = result.Data ?? SecurityTemplates.Standard;

            var directory = Path.GetDirectoryName(configPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 寫入完整版（含 CSP）- 供後台 Admin / API 使用
            var configContent = NginxConfigGenerator.Generate(settings);
            await File.WriteAllTextAsync(configPath, configContent, cancellationToken);
            _logger.LogInformation("NginxConfigInitializer: Config written to {Path}", configPath);

            // 寫入無 CSP 版 - 供前台使用（CSP 由 Next.js middleware 以 nonce 方式處理）
            var noCspFileName = Path.GetFileNameWithoutExtension(configPath) + "-no-csp" + Path.GetExtension(configPath);
            var noCspPath = Path.Combine(directory!, noCspFileName);
            var noCspContent = NginxConfigGenerator.GenerateWithoutCsp(settings);
            await File.WriteAllTextAsync(noCspPath, noCspContent, cancellationToken);
            _logger.LogInformation("NginxConfigInitializer: No-CSP config written to {Path}", noCspPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "NginxConfigInitializer: Failed to write initial config");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
