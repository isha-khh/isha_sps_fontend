using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Captcha;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 注冊請求
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// 信箱
    /// </summary>
    [Required(ErrorMessage = "信箱不能為空")]
    [EmailAddress(ErrorMessage = "信箱格式不正確")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密碼
    /// </summary>
    [Required(ErrorMessage = "密碼不能為空")]
    [MinLength(6, ErrorMessage = "密碼至少6個字符")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 確認密碼
    /// </summary>
    [Required(ErrorMessage = "確認密碼不能為空")]
    [Compare(nameof(Password), ErrorMessage = "兩次密碼不一致")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// 姓名
    /// </summary>
    [Required(ErrorMessage = "姓名不能為空")]
    [MaxLength(50, ErrorMessage = "姓名不能超過50個字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 電話
    /// </summary>
    [Required(ErrorMessage = "電話不能為空")]
    [Phone(ErrorMessage = "電話格式不正確")]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 分機
    /// </summary>
    public string? Extension { get; set; }

    /// <summary>
    /// 手機號碼
    /// </summary>
    [Phone(ErrorMessage = "手機號碼格式不正確")]
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 企業ID（可選）
    /// </summary>
    public Guid? CompanyId { get; set; }

    /// <summary>
    /// 驗證碼資料
    /// </summary>
    public CaptchaData? Captcha { get; set; }
}
