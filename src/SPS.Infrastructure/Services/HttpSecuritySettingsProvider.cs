using Microsoft.Extensions.Caching.Memory;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// HTTP 安全性設定提供者實作
/// </summary>
public class HttpSecuritySettingsProvider : IHttpSecuritySettingsProvider
{
    private readonly ISystemSettingService _settingService;
    private readonly IMemoryCache _cache;
    private const string CacheKey = "HttpSecuritySettings";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public HttpSecuritySettingsProvider(
        ISystemSettingService settingService,
        IMemoryCache cache)
    {
        _settingService = settingService;
        _cache = cache;
    }

    /// <inheritdoc />
    public async Task<HttpSecuritySettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(CacheKey, out HttpSecuritySettingsDto? cachedSettings) && cachedSettings != null)
        {
            return cachedSettings;
        }

        var result = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity", cancellationToken);
        var settings = result.Data ?? SecurityTemplates.Standard;

        _cache.Set(CacheKey, settings, CacheDuration);
        return settings;
    }

    /// <inheritdoc />
    public async Task<CookieSecuritySettingsDto> GetCookieSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetSettingsAsync(cancellationToken);
        return settings.Cookie;
    }

    /// <inheritdoc />
    public void ClearCache()
    {
        _cache.Remove(CacheKey);
    }
}
