using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Infrastructure.Data;
using StackExchange.Redis;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 系統資訊 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SystemInfoController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IConnectionMultiplexer _redis;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ISystemSettingService _settingService;
    private readonly IFido2Provider _fido2Provider;
    private readonly ILogger<SystemInfoController> _logger;
    private static readonly DateTime _startTime = DateTime.UtcNow;

    public SystemInfoController(
        ApplicationDbContext dbContext,
        IConnectionMultiplexer redis,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ISystemSettingService settingService,
        IFido2Provider fido2Provider,
        ILogger<SystemInfoController> logger)
    {
        _dbContext = dbContext;
        _redis = redis;
        _environment = environment;
        _configuration = configuration;
        _settingService = settingService;
        _fido2Provider = fido2Provider;
        _logger = logger;
    }

    /// <summary>
    /// 取得系統資訊
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "取得系統資訊", Description = "取得伺服器、資料庫、快取等系統資訊")]
    [ProducesResponseType(typeof(SystemInfoDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemInfoDto>> GetSystemInfo()
    {
        var info = new SystemInfoDto
        {
            Version = GetVersion(),
            BuildTime = GetBuildTime(),
            Environment = _environment.EnvironmentName,
            ServerTime = DateTime.UtcNow.ToString("O"),
            Uptime = GetUptime(),
            MemoryUsage = GetMemoryUsage(),
            DiskUsage = GetDiskUsage(),
            Database = await GetDatabaseInfoAsync(),
            Cache = await GetCacheInfoAsync(),
            Runtime = GetRuntimeInfo(),
            Fido2 = await GetFido2InfoAsync()
        };

        return Ok(info);
    }

    /// <summary>
    /// 取得健康狀態
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "取得健康狀態", Description = "檢查系統各組件的健康狀態")]
    public async Task<ActionResult> GetHealthStatus()
    {
        var dbConnected = await CheckDatabaseConnectionAsync();
        var redisConnected = await CheckRedisConnectionAsync();

        var status = new
        {
            Status = dbConnected && redisConnected ? "Healthy" : "Degraded",
            Timestamp = DateTime.UtcNow,
            Components = new
            {
                Database = dbConnected ? "Healthy" : "Unhealthy",
                Redis = redisConnected ? "Healthy" : "Unhealthy"
            }
        };

        return dbConnected && redisConnected ? Ok(status) : StatusCode(503, status);
    }

    private string GetVersion()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var informational = assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion;
        if (!string.IsNullOrEmpty(informational))
            return informational;
        var version = assembly.GetName().Version;
        return version != null ? $"{version.Major}.{version.Minor}.{version.Build}" : "1.0.0";
    }

    private string GetBuildTime()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var buildDate = System.IO.File.GetLastWriteTime(assembly.Location);
        return buildDate.ToString("O");
    }

    private string GetUptime()
    {
        var uptime = DateTime.UtcNow - _startTime;

        if (uptime.TotalDays >= 1)
        {
            return $"{(int)uptime.TotalDays} 天 {uptime.Hours} 小時";
        }
        else if (uptime.TotalHours >= 1)
        {
            return $"{(int)uptime.TotalHours} 小時 {uptime.Minutes} 分鐘";
        }
        else
        {
            return $"{(int)uptime.TotalMinutes} 分鐘";
        }
    }

    private MemoryUsageDto GetMemoryUsage()
    {
        var process = Process.GetCurrentProcess();
        var workingSet = process.WorkingSet64;

        // 取得系統總記憶體
        long totalMemory = 0;
        long availableMemory = 0;

        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                // Linux: 從 /proc/meminfo 讀取
                var memInfo = System.IO.File.ReadAllLines("/proc/meminfo");
                foreach (var line in memInfo)
                {
                    if (line.StartsWith("MemTotal:"))
                    {
                        totalMemory = ParseMemInfoValue(line) * 1024; // KB to bytes
                    }
                    else if (line.StartsWith("MemAvailable:"))
                    {
                        availableMemory = ParseMemInfoValue(line) * 1024;
                    }
                }
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // Windows: 使用 GC 取得託管記憶體
                totalMemory = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes;
                availableMemory = totalMemory - workingSet;
            }
            else
            {
                // 其他平台：使用進程記憶體
                totalMemory = workingSet * 2;
                availableMemory = totalMemory - workingSet;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get memory info");
            totalMemory = workingSet * 2;
            availableMemory = totalMemory - workingSet;
        }

        return new MemoryUsageDto
        {
            Total = totalMemory,
            Used = totalMemory - availableMemory,
            Free = availableMemory
        };
    }

    private long ParseMemInfoValue(string line)
    {
        var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2 && long.TryParse(parts[1], out var value))
        {
            return value;
        }
        return 0;
    }

    private DiskUsageDto GetDiskUsage()
    {
        try
        {
            // 取得應用程式所在磁碟的資訊
            var appPath = AppContext.BaseDirectory;
            var driveInfo = new DriveInfo(Path.GetPathRoot(appPath) ?? "/");

            return new DiskUsageDto
            {
                Total = driveInfo.TotalSize,
                Used = driveInfo.TotalSize - driveInfo.AvailableFreeSpace,
                Free = driveInfo.AvailableFreeSpace
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get disk info");
            return new DiskUsageDto();
        }
    }

    private async Task<DatabaseInfoDto> GetDatabaseInfoAsync()
    {
        var dbInfo = new DatabaseInfoDto
        {
            Type = "PostgreSQL"
        };

        try
        {
            // 檢查連線
            dbInfo.IsConnected = await _dbContext.Database.CanConnectAsync();

            if (dbInfo.IsConnected)
            {
                // 使用 ADO.NET 直接執行 SQL
                var connection = _dbContext.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync();
                }

                // 取得 PostgreSQL 版本
                using (var versionCmd = connection.CreateCommand())
                {
                    versionCmd.CommandText = "SELECT version()";
                    var versionResult = await versionCmd.ExecuteScalarAsync();
                    if (versionResult != null)
                    {
                        var versionString = versionResult.ToString() ?? "";
                        // 解析版本，例如 "PostgreSQL 14.5 on x86_64..."
                        var versionParts = versionString.Split(' ');
                        if (versionParts.Length >= 2)
                        {
                            dbInfo.Version = versionParts[1];
                        }
                    }
                }

                // 取得資料庫大小
                using (var sizeCmd = connection.CreateCommand())
                {
                    sizeCmd.CommandText = "SELECT pg_database_size(current_database())";
                    var sizeResult = await sizeCmd.ExecuteScalarAsync();
                    if (sizeResult != null && long.TryParse(sizeResult.ToString(), out var size))
                    {
                        dbInfo.Size = size;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get database info");
            dbInfo.IsConnected = false;
        }

        return dbInfo;
    }

    private async Task<CacheInfoDto> GetCacheInfoAsync()
    {
        var cacheInfo = new CacheInfoDto
        {
            Type = "Redis"
        };

        try
        {
            cacheInfo.IsConnected = _redis.IsConnected;

            if (cacheInfo.IsConnected)
            {
                // 嘗試取得詳細資訊（需要 admin mode）
                try
                {
                    var server = _redis.GetServer(_redis.GetEndPoints().First());
                    var info = await server.InfoAsync("stats");
                    var memory = await server.InfoAsync("memory");

                    // 計算命中率
                    var statsSection = info.FirstOrDefault(s => s.Key == "stats");
                    if (!string.IsNullOrEmpty(statsSection.Key))
                    {
                        var keyspaceHits = statsSection
                            .FirstOrDefault(p => p.Key == "keyspace_hits").Value;
                        var keyspaceMisses = statsSection
                            .FirstOrDefault(p => p.Key == "keyspace_misses").Value;

                        if (long.TryParse(keyspaceHits, out var hits) &&
                            long.TryParse(keyspaceMisses, out var misses))
                        {
                            var total = hits + misses;
                            cacheInfo.HitRate = total > 0 ? Math.Round((double)hits / total * 100, 2) : 0;
                        }
                    }

                    // 取得已使用記憶體
                    var memorySection = memory.FirstOrDefault(s => s.Key == "memory");
                    if (!string.IsNullOrEmpty(memorySection.Key))
                    {
                        var usedMemory = memorySection
                            .FirstOrDefault(p => p.Key == "used_memory").Value;

                        if (long.TryParse(usedMemory, out var usedMemoryBytes))
                        {
                            cacheInfo.UsedMemory = usedMemoryBytes;
                        }
                    }
                }
                catch (RedisCommandException)
                {
                    // INFO 命令需要 admin mode，如果沒有權限則跳過詳細資訊
                    _logger.LogDebug("Redis INFO command requires admin mode, skipping detailed info");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get Redis info");
            cacheInfo.IsConnected = false;
        }

        return cacheInfo;
    }

    private RuntimeInfoDto GetRuntimeInfo()
    {
        return new RuntimeInfoDto
        {
            DotNetVersion = RuntimeInformation.FrameworkDescription,
            OperatingSystem = RuntimeInformation.OSDescription,
            ProcessorCount = System.Environment.ProcessorCount,
            Is64Bit = System.Environment.Is64BitProcess
        };
    }

    private async Task<Fido2InfoDto> GetFido2InfoAsync()
    {
        var settings = await _fido2Provider.GetEffectiveSettingsAsync();

        return new Fido2InfoDto
        {
            ServerDomain = settings.ServerDomain ?? string.Empty,
            ServerName = settings.ServerName ?? string.Empty,
            Origins = settings.Origins ?? new List<string>(),
            EnableForMember = settings.EnableForMember,
            EnableForAdmin = settings.EnableForAdmin
        };
    }

    private async Task<bool> CheckDatabaseConnectionAsync()
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    private Task<bool> CheckRedisConnectionAsync()
    {
        try
        {
            return Task.FromResult(_redis.IsConnected);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }
}
