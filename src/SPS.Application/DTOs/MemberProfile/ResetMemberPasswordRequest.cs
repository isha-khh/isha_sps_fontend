using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 重置會員密碼請求（Manager 使用）
/// </summary>
public class ResetMemberPasswordRequest
{
    /// <summary>
    /// 新密碼
    /// </summary>
    [Required(ErrorMessage = "新密碼為必填")]
    [MinLength(8, ErrorMessage = "密碼長度至少 8 個字元")]
    public string NewPassword { get; set; } = string.Empty;

    /// <summary>
    /// 是否要求用戶首次登入時修改密碼
    /// </summary>
    public bool RequirePasswordChange { get; set; } = true;
}
