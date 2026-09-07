using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace SPS.Infrastructure.Services;

/// <summary>
/// Nginx 重新載入服務 - 透過 Docker 命令觸發 Nginx reload
/// </summary>
public class NginxReloadService
{
    private readonly ILogger<NginxReloadService> _logger;
    private const string NginxContainerName = "sps-nginx";

    public NginxReloadService(ILogger<NginxReloadService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 觸發 Nginx 重新載入配置
    /// </summary>
    public async Task<(bool Success, string Message)> ReloadNginxAsync()
    {
        try
        {
            // 檢查是否在 Docker 環境中
            if (!File.Exists("/var/run/docker.sock"))
            {
                _logger.LogWarning("Docker socket not found, skipping nginx reload");
                return (false, "Not running in Docker environment or docker.sock not mounted");
            }

            // 執行 docker exec 命令
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"exec {NginxContainerName} nginx -s reload",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode == 0)
            {
                _logger.LogInformation("Nginx reloaded successfully");
                return (true, "Nginx reloaded successfully");
            }
            else
            {
                _logger.LogError("Nginx reload failed: {Error}", error);
                return (false, $"Nginx reload failed: {error}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while reloading nginx");
            return (false, $"Error: {ex.Message}");
        }
    }

    /// <summary>
    /// 檢查 Nginx 容器是否存在且運行中
    /// </summary>
    public async Task<bool> IsNginxContainerRunningAsync()
    {
        try
        {
            if (!File.Exists("/var/run/docker.sock"))
            {
                return false;
            }

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"inspect -f '{{{{.State.Running}}}}' {NginxContainerName}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            return process.ExitCode == 0 && output.Trim().Equals("true", StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}
