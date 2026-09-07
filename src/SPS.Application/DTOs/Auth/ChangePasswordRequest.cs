using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 後台管理員修改密碼請求
/// </summary>
public class ChangePasswordRequest
{
    /// <summary>
    /// 目前密碼
    /// </summary>
    [Required(ErrorMessage = "目前密碼為必填")]
    public string CurrentPassword { get; set; } = string.Empty;

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
