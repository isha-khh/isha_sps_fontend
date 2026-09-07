using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 發送驗證碼請求
/// </summary>
public class SendVerificationCodeRequest
{
    /// <summary>
    /// 郵箱地址
    /// </summary>
    [Required(ErrorMessage = "郵箱為必填")]
    [EmailAddress(ErrorMessage = "郵箱格式不正確")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 驗證碼用途
    /// </summary>
    [Required(ErrorMessage = "用途為必填")]
    public VerificationCodePurpose Purpose { get; set; }
}
