using System.ComponentModel.DataAnnotations;
using SPS.Application.Common;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 更新申請請求（僅草稿狀態可更新）
/// </summary>
public class UpdateApplicationRequest
{
    /// <summary>
    /// 聯系人姓名（必填欄位不使用 Optional）
    /// </summary>
    public string? ContactName { get; set; }

    /// <summary>
    /// 電話（必填欄位不使用 Optional）
    /// </summary>
    [Phone(ErrorMessage = "電話格式不正確")]
    public string? Phone { get; set; }

    /// <summary>
    /// 分機（可選欄位，使用 Optional 以支援清除）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> Extension { get; set; }

    /// <summary>
    /// 手機號碼（可選欄位，使用 Optional 以支援清除）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> MobilePhone { get; set; }

    /// <summary>
    /// 職位（可選欄位，使用 Optional 以支援清除）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> Position { get; set; }

    /// <summary>
    /// 統一編號
    /// </summary>
    public string? UnifiedSocialCreditCode { get; set; }

    /// <summary>
    /// 公司名稱（前端從工商API獲取或手動填寫）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> CompanyName { get; set; }

    /// <summary>
    /// 公司地址（前端從工商API獲取或手動填寫）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> CompanyAddress { get; set; }

    /// <summary>
    /// 營業範圍（前端從工商API獲取或手動填寫）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> BusinessScope { get; set; }

    /// <summary>
    /// 申請理由（可選欄位，使用 Optional 以支援清除）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> Reason { get; set; }

    /// <summary>
    /// 備注（可選欄位，使用 Optional 以支援清除）
    /// 未提供 = 不更新，提供 null = 清除，提供值 = 更新
    /// </summary>
    public Optional<string> Remark { get; set; }
}
