namespace SPS.Application.DTOs.Captcha;

/// <summary>
/// 驗證碼類型
/// </summary>
public enum CaptchaType
{
    /// <summary>
    /// 無驗證碼
    /// </summary>
    None = 0,

    /// <summary>
    /// Cloudflare Turnstile
    /// </summary>
    Turnstile = 1,

    /// <summary>
    /// 圖片驗證碼
    /// </summary>
    ImageCode = 2
}
