namespace SPS.Application.DTOs.Captcha;

/// <summary>
/// 驗證碼生成回應
/// </summary>
public class CaptchaGenerateResponse
{
    /// <summary>
    /// 驗證碼 ID
    /// </summary>
    public string CaptchaId { get; set; } = string.Empty;

    /// <summary>
    /// Base64 編碼的圖片
    /// </summary>
    public string ImageBase64 { get; set; } = string.Empty;

    /// <summary>
    /// 過期時間（秒）
    /// </summary>
    public int ExpiresInSeconds { get; set; }
}
