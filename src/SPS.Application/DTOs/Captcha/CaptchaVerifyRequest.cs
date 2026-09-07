using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Captcha;

/// <summary>
/// 驗證碼驗證請求
/// </summary>
public class CaptchaVerifyRequest
{
    /// <summary>
    /// 驗證碼類型
    /// </summary>
    public CaptchaType Type { get; set; }

    /// <summary>
    /// 驗證碼 ID（用於圖片驗證碼）
    /// </summary>
    public string? CaptchaId { get; set; }

    /// <summary>
    /// 驗證碼值（用於圖片驗證碼）
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Turnstile Token（用於 Turnstile 驗證）
    /// </summary>
    public string? TurnstileToken { get; set; }
}

/// <summary>
/// 登入請求中的驗證碼資料
/// </summary>
public class CaptchaData
{
    /// <summary>
    /// 驗證碼類型
    /// </summary>
    public CaptchaType Type { get; set; }

    /// <summary>
    /// 驗證碼 ID（用於圖片驗證碼）
    /// </summary>
    public string? CaptchaId { get; set; }

    /// <summary>
    /// 驗證碼值（用於圖片驗證碼）
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Turnstile Token（用於 Turnstile 驗證）
    /// </summary>
    public string? TurnstileToken { get; set; }
}
