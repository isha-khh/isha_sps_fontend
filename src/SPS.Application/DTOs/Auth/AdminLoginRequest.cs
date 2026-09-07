using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Captcha;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 後台管理員登入請求
/// </summary>
public class AdminLoginRequest
{
    /// <summary>
    /// 信箱
    /// </summary>
    [Required(ErrorMessage = "信箱不能為空")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密碼
    /// </summary>
    [Required(ErrorMessage = "密碼不能為空")]
    [MinLength(6, ErrorMessage = "密碼至少6個字符")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 驗證碼資料
    /// </summary>
    public CaptchaData? Captcha { get; set; }
}