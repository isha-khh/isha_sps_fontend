using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請成員響應 DTO
/// </summary>
public class ApplicationMemberResponse
{
    /// <summary>
    /// ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 申請人姓名
    /// </summary>
    public string ContactName { get; set; } = string.Empty;

    /// <summary>
    /// 申請人職稱
    /// </summary>
    public string Position { get; set; } = string.Empty;

    /// <summary>
    /// 申請人Email
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 聯絡電話
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 分機
    /// </summary>
    public string? Extension { get; set; }

    /// <summary>
    /// 手機電話
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 會員職位
    /// </summary>
    public MemberPosition MemberPosition { get; set; }

    /// <summary>
    /// 排序序號
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// 狀態
    /// </summary>
    public Status Status { get; set; }

    /// <summary>
    /// 審核通過後創建的Member ID
    /// </summary>
    public Guid? CreatedMemberId { get; set; }

    /// <summary>
    /// 創建時間
    /// </summary>
    public DateTime CreatedTime { get; set; }
}
