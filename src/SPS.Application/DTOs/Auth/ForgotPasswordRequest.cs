using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Captcha;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 忘記密碼請求 - 發送重置密碼郵件
/// </summary>
public class ForgotPasswordRequest
{
    /// <summary>
    /// 電子郵件
    /// </summary>
    [Required(ErrorMessage = "電子郵件為必填")]
    [EmailAddress(ErrorMessage = "電子郵件格式不正確")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 驗證碼資料
    /// </summary>
    public CaptchaData? Captcha { get; set; }
}
