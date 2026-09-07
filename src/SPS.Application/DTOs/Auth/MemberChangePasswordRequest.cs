using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 前台會員修改密碼請求（需驗證碼）
/// </summary>
public class MemberChangePasswordRequest
{
    /// <summary>
    /// 郵箱地址
    /// </summary>
    [Required(ErrorMessage = "郵箱為必填")]
    [EmailAddress(ErrorMessage = "郵箱格式不正確")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 驗證碼
    /// </summary>
    [Required(ErrorMessage = "驗證碼為必填")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "驗證碼長度必須為 6 位")]
    public string VerificationCode { get; set; } = string.Empty;

    /// <summary>
    /// 新密碼
    /// </summary>
    [Required(ErrorMessage = "新密碼為必填")]
    [MinLength(8, ErrorMessage = "密碼長度至少 8 個字元")]
    public string NewPassword { get; set; } = string.Empty;

    /// <summary>
    /// 確認新密碼
    /// </summary>
    [Required(ErrorMessage = "確認密碼為必填")]
    [Compare(nameof(NewPassword), ErrorMessage = "確認密碼與新密碼不符")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
