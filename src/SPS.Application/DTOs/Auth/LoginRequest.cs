using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Captcha;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 登入請求
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// 郵箱
    /// </summary>
    [Required(ErrorMessage = "郵箱不能為空")]
    [EmailAddress(ErrorMessage = "郵箱格式不正確")]
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
