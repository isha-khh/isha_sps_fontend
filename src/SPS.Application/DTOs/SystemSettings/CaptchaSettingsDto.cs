namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// CAPTCHA 系統設定
/// </summary>
public class CaptchaSettingsDto
{
    /// <summary>
    /// 是否啟用 CAPTCHA
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// 驗證碼類型：0=None, 1=Turnstile, 2=ImageCode
    /// </summary>
    public int CaptchaType { get; set; } = 0;

    /// <summary>
    /// 適用場景設定
    /// </summary>
    public CaptchaScenarios Scenarios { get; set; } = new();

    /// <summary>
    /// Turnstile 設定
    /// </summary>
    public TurnstileSettings Turnstile { get; set; } = new();

    /// <summary>
    /// 圖片驗證碼設定
    /// </summary>
    public ImageCaptchaSettings ImageCaptcha { get; set; } = new();
}

/// <summary>
/// CAPTCHA 適用場景
/// </summary>
public class CaptchaScenarios
{
    /// <summary>
    /// 會員登入
    /// </summary>
    public bool MemberLogin { get; set; } = false;

    /// <summary>
    /// 會員註冊
    /// </summary>
    public bool MemberRegister { get; set; } = false;

    /// <summary>
    /// 管理員登入
    /// </summary>
    public bool AdminLogin { get; set; } = false;

    /// <summary>
    /// 忘記密碼
    /// </summary>
    public bool ForgotPassword { get; set; } = false;
}

/// <summary>
/// Cloudflare Turnstile 設定
/// </summary>
public class TurnstileSettings
{
    /// <summary>
    /// 網站金鑰（前端使用）
    /// </summary>
    public string SiteKey { get; set; } = string.Empty;

    /// <summary>
    /// 秘密金鑰（後端驗證用）
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;
}

/// <summary>
/// 圖片驗證碼設定
/// </summary>
public class ImageCaptchaSettings
{
    /// <summary>
    /// 驗證碼長度
    /// </summary>
    public int CodeLength { get; set; } = 4;

    /// <summary>
    /// 過期時間（秒）
    /// </summary>
    public int ExpirationSeconds { get; set; } = 120;

    /// <summary>
    /// 最大嘗試次數
    /// </summary>
    public int MaxAttempts { get; set; } = 5;

    /// <summary>
    /// 是否啟用音訊驗證碼
    /// </summary>
    public bool EnableAudio { get; set; } = true;
}

/// <summary>
/// 公開的 CAPTCHA 設定（給前端使用）
/// </summary>
public class CaptchaPublicSettings
{
    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 驗證碼類型
    /// </summary>
    public int CaptchaType { get; set; }

    /// <summary>
    /// Turnstile 網站金鑰（僅 Turnstile 類型時有值）
    /// </summary>
    public string? TurnstileSiteKey { get; set; }

    /// <summary>
    /// 是否啟用音訊驗證碼
    /// </summary>
    public bool EnableAudio { get; set; }
}
