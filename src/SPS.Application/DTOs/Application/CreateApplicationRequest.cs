using SPS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 創建申請請求
/// </summary>
public class CreateApplicationRequest
{
    /// <summary>
    /// 申請人類型（個人會員/企業會員）- 決定下面企業專屬欄位是否必填
    /// </summary>
    [Required(ErrorMessage = "申請人類型不能為空")]
    public ApplicantType ApplicantType { get; set; }

    /// <summary>
    /// 既有會員 ID（有填代表這是既有會員送出的升級申請，審核通過後更新
    /// 這個既有會員，不是新建帳號）
    /// </summary>
    public Guid? ExistingMemberId { get; set; }

    /// <summary>
    /// 申請角色（個人會員固定為 None，企業會員才需要選需求端/供給端）
    /// </summary>
    [Required(ErrorMessage = "申請角色不能為空")]
    public MemberRole MemberRole { get; set; }

    /// <summary>
    /// 供給端申請分流（卓越/新興），只有 MemberRole == Supplier 時有意義
    /// </summary>
    public CompanyLevel? SupplierTier { get; set; }

    /// <summary>
    /// 統一編號（企業會員必填，個人會員不需要）
    /// </summary>
    [MaxLength(18, ErrorMessage = "統一編號長度不能超過18個字符")]
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;

    /// <summary>
    /// 負責人姓名（企業會員必填，個人會員不需要）
    /// </summary>
    [MaxLength(100, ErrorMessage = "負責人姓名長度不能超過100個字符")]
    public string ContactPerson { get; set; } = string.Empty;

    /// <summary>
    /// 公司名稱（企業會員：前端從工商API獲取或手動填寫；
    /// 個人會員：所屬公司名稱，自由文字）
    /// </summary>
    [MaxLength(200, ErrorMessage = "公司名稱長度不能超過200個字符")]
    public string? CompanyName { get; set; }

    /// <summary>
    /// 產業別（個人會員專用，自由文字）
    /// </summary>
    [MaxLength(100, ErrorMessage = "產業別長度不能超過100個字符")]
    public string? Industry { get; set; }

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

    /// <summary>公司專頁資料（電話、縣市／鄉鎮區、簡介、標籤、工廠…）</summary>
    public CompanyProfileDto? Profile { get; set; }

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
