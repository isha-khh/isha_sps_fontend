using SPS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請成員 DTO
/// </summary>
public class ApplicationMemberDto
{
    /// <summary>
    /// ID（更新時需要）
    /// </summary>
    public Guid? Id { get; set; }

    /// <summary>
    /// 申請人姓名（必填）
    /// </summary>
    [Required(ErrorMessage = "申請人姓名不能為空")]
    [MaxLength(100, ErrorMessage = "姓名長度不能超過100個字符")]
    public string ContactName { get; set; } = string.Empty;

    /// <summary>
    /// 申請人職稱（必填）
    /// </summary>
    [Required(ErrorMessage = "申請人職稱不能為空")]
    [MaxLength(100, ErrorMessage = "職稱長度不能超過100個字符")]
    public string Position { get; set; } = string.Empty;

    /// <summary>
    /// 申請人Email（必填）
    /// </summary>
    [Required(ErrorMessage = "Email不能為空")]
    [EmailAddress(ErrorMessage = "Email格式不正確")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 聯絡電話（必填）
    /// </summary>
    [Required(ErrorMessage = "聯絡電話不能為空")]
    [Phone(ErrorMessage = "電話格式不正確")]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 分機（選填）
    /// </summary>
    [MaxLength(20, ErrorMessage = "分機長度不能超過20個字符")]
    public string? Extension { get; set; }

    /// <summary>
    /// 手機電話（選填）
    /// </summary>
    [Phone(ErrorMessage = "手機號碼格式不正確")]
    [MaxLength(50, ErrorMessage = "手機號碼長度不能超過50個字符")]
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 密碼（必填）
    /// </summary>
    [Required(ErrorMessage = "密碼不能為空")]
    [MinLength(8, ErrorMessage = "密碼長度不能少於8位")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 確認密碼（必填）
    /// </summary>
    [Required(ErrorMessage = "確認密碼不能為空")]
    [Compare("Password", ErrorMessage = "兩次密碼輸入不一致")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// 會員職位（Manager/Employee）
    /// </summary>
    [Required(ErrorMessage = "會員職位不能為空")]
    public MemberPosition MemberPosition { get; set; }

    /// <summary>
    /// 排序序號
    /// </summary>
    public int OrderIndex { get; set; }
}
