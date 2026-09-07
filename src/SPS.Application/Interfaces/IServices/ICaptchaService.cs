using SPS.Application.Common;
using SPS.Application.DTOs.Captcha;
using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// CAPTCHA 驗證碼服務介面
/// </summary>
public interface ICaptchaService
{
    /// <summary>
    /// 獲取指定場景的公開設定
    /// </summary>
    /// <param name="scenario">場景名稱（member-login, member-register, admin-login, forgot-password）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>公開的 CAPTCHA 設定</returns>
    Task<Result<CaptchaPublicSettings>> GetPublicSettingsAsync(string scenario, CancellationToken cancellationToken = default);

    /// <summary>
    /// 生成圖片驗證碼
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證碼生成回應（包含 captchaId 和 base64 圖片）</returns>
    Task<Result<CaptchaGenerateResponse>> GenerateImageCaptchaAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取驗證碼音訊
    /// </summary>
    /// <param name="captchaId">驗證碼 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>WAV 格式音訊資料</returns>
    Task<Result<byte[]>> GetCaptchaAudioAsync(string captchaId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證 CAPTCHA
    /// </summary>
    /// <param name="request">驗證請求</param>
    /// <param name="remoteIp">客戶端 IP（用於 Turnstile 驗證）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    Task<Result<bool>> VerifyCaptchaAsync(CaptchaVerifyRequest request, string? remoteIp, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證 CAPTCHA（使用 CaptchaData）
    /// </summary>
    /// <param name="captcha">驗證碼資料</param>
    /// <param name="remoteIp">客戶端 IP</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    Task<Result<bool>> VerifyCaptchaAsync(CaptchaData? captcha, string? remoteIp, CancellationToken cancellationToken = default);

    /// <summary>
    /// 使驗證碼失效
    /// </summary>
    /// <param name="captchaId">驗證碼 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task InvalidateCaptchaAsync(string captchaId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查指定場景是否需要驗證碼
    /// </summary>
    /// <param name="scenario">場景名稱</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否需要驗證碼</returns>
    Task<bool> IsScenarioEnabledAsync(string scenario, CancellationToken cancellationToken = default);
}
