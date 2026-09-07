using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 後台管理員註冊請求（僅用於初始化系統管理員）
/// </summary>
public class AdminRegisterRequest
{
    /// <summary>
    /// 姓名
    /// </summary>
    [Required(ErrorMessage = "姓名不能為空")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 帳號
    /// </summary>
    [Required(ErrorMessage = "帳號不能為空")]
    [MinLength(4, ErrorMessage = "帳號至少4個字符")]
    public string Account { get; set; } = string.Empty;

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
    [MinLength(8, ErrorMessage = "密碼至少8個字符")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 確認密碼
    /// </summary>
    [Required(ErrorMessage = "確認密碼不能為空")]
    [Compare(nameof(Password), ErrorMessage = "兩次密碼輸入不一致")]
    public string ConfirmPassword { get; set; } = string.Empty;
}