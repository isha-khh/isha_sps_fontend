using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 後台管理員重置密碼請求 - 透過重置 Token 設定新密碼
/// </summary>
public class AdminResetPasswordRequest
{
    /// <summary>
    /// 重置密碼 Token
    /// </summary>
    [Required(ErrorMessage = "Token 為必填")]
    public string Token { get; set; } = string.Empty;

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
