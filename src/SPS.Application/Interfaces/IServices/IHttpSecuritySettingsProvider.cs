using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// HTTP 安全性設定提供者介面
/// </summary>
public interface IHttpSecuritySettingsProvider
{
    /// <summary>
    /// 取得 HTTP 安全性設定（帶快取）
    /// </summary>
    Task<HttpSecuritySettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得 Cookie 設定
    /// </summary>
    Task<CookieSecuritySettingsDto> GetCookieSettingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 清除快取
    /// </summary>
    void ClearCache();
}
