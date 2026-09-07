using Fido2NetLib;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// FIDO2 設定提供者實作（DB 優先、環境變數/appsettings 兜底）
/// </summary>
public class Fido2Provider : IFido2Provider
{
    private readonly ISystemSettingService _settingService;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<Fido2Provider> _logger;
    private const string CacheKey = "Fido2Instance";
    private const string SettingsCacheKey = "Fido2EffectiveSettings";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    public Fido2Provider(
        ISystemSettingService settingService,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<Fido2Provider> logger)
    {
        _settingService = settingService;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IFido2> GetFido2Async(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey, out IFido2? cached) && cached != null)
            return cached;

        var settings = await GetEffectiveSettingsAsync(ct);

        var fido2Config = new Fido2Configuration
        {
            ServerDomain = settings.ServerDomain,
            ServerName = settings.ServerName,
            Origins = settings.Origins?.ToHashSet() ?? new HashSet<string>()
        };

        var fido2 = new Fido2(fido2Config);
        _cache.Set(CacheKey, (IFido2)fido2, CacheDuration);

        _logger.LogInformation(
            "FIDO2 instance created with RP ID: {ServerDomain}, Origins: {Origins}",
            fido2Config.ServerDomain,
            string.Join(", ", fido2Config.Origins));

        return fido2;
    }

    public async Task<Fido2SettingsDto> GetEffectiveSettingsAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(SettingsCacheKey, out Fido2SettingsDto? cachedSettings) && cachedSettings != null)
            return cachedSettings;

        // 從 DB 讀取
        var dbResult = await _settingService.GetSettingAsync<Fido2SettingsDto>("Fido2", ct);
        var dbSettings = dbResult.Data ?? new Fido2SettingsDto();

        // 從 IConfiguration 讀取（appsettings.json / 環境變數）
        var configSection = _configuration.GetSection("Fido2");

        // 合併：DB 有值優先，否則 fallback 到 config
        var effective = new Fido2SettingsDto
        {
            EnableForMember = dbSettings.EnableForMember,
            EnableForAdmin = dbSettings.EnableForAdmin,
            ServerDomain = !string.IsNullOrWhiteSpace(dbSettings.ServerDomain)
                ? dbSettings.ServerDomain
                : configSection["ServerDomain"] ?? string.Empty,
            ServerName = !string.IsNullOrWhiteSpace(dbSettings.ServerName)
                ? dbSettings.ServerName
                : configSection["ServerName"] ?? string.Empty,
            Origins = dbSettings.Origins is { Count: > 0 }
                ? dbSettings.Origins
                : configSection.GetSection("Origins").Get<List<string>>() ?? new List<string>()
        };

        _cache.Set(SettingsCacheKey, effective, CacheDuration);
        return effective;
    }

    public void InvalidateCache()
    {
        _cache.Remove(CacheKey);
        _cache.Remove(SettingsCacheKey);
    }
}
