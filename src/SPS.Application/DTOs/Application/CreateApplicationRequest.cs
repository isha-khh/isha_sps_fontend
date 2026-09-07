using SPS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 創建申請請求
/// </summary>
public class CreateApplicationRequest
{
    /// <summary>
    /// 申請角色
    /// </summary>
    [Required(ErrorMessage = "申請角色不能為空")]
    public MemberRole MemberRole { get; set; }

    /// <summary>
    /// 統一編號
    /// </summary>
    [Required(ErrorMessage = "統一編號不能為空")]
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;

    /// <summary>
    /// 負責人姓名（必填）
    /// </summary>
    [Required(ErrorMessage = "負責人姓名不能為空")]
    [MaxLength(100, ErrorMessage = "負責人姓名長度不能超過100個字符")]
    public string ContactPerson { get; set; } = string.Empty;

    /// <summary>
    /// 公司名稱（前端從工商API獲取或手動填寫）
    /// </summary>
    [MaxLength(200, ErrorMessage = "公司名稱長度不能超過200個字符")]
    public string? CompanyName { get; set; }

    /// <summary>
    /// 公司地址（前端從工商API獲取或手動填寫）
    /// </summary>
    [MaxLength(500, ErrorMessage = "公司地址長度不能超過500個字符")]
    public string? CompanyAddress { get; set; }

    /// <summary>
    /// 營業範圍（前端從工商API獲取或手動填寫）
    /// </summary>
    [MaxLength(1000, ErrorMessage = "營業範圍長度不能超過1000個字符")]
    public string? BusinessScope { get; set; }

    /// <summary>
    /// 申請理由
    /// </summary>
    [MaxLength(500, ErrorMessage = "申請理由長度不能超過500個字符")]
    public string? Reason { get; set; }

    /// <summary>
    /// 多個成員（至少一個，最多10個）
    /// </summary>
    [Required(ErrorMessage = "必須至少添加一個會員")]
    [MinLength(1, ErrorMessage = "必須至少添加一個會員")]
    [MaxLength(10, ErrorMessage = "最多只能添加10個會員")]
    public List<ApplicationMemberDto> Members { get; set; } = new();
}
