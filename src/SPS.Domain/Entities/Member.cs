using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Member : BaseEntity<Guid>
{
    public DataMode DataMode { get; set; }
    public string Number { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public string Password { get; set; } = string.Empty;
    public int PasswordExpirationPolicy { get; set; }
    public DateTime? PasswordChangedTime { get; set; }
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime? LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public DateTime? LastVisitedTime { get; set; }
    public int? PhotoId { get; set; }
    public Guid? PersonId { get; set; }
    public Status Status { get; set; }
    public string? Remark { get; set; }
    public Guid? CompanyId { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public DateTime? ExpiryTime { get; set; }
    public bool FirstChanged { get; set; }
    public DateTime? LockedTime { get; set; }
    public int LoginFailure { get; set; }
    public bool PasswordChanged { get; set; }

    // ==================== 申请审核相关 ====================

    /// <summary>
    /// 会员角色（供給端/需求端）
    /// </summary>
    public MemberRole Role { get; set; }

    /// <summary>
    /// 會員職位（經理/員工）
    /// </summary>
    public MemberPosition MemberPosition { get; set; }

    /// <summary>
    /// 會員權限（使用 Flags 枚舉）
    /// </summary>
    public MemberPermission Permissions { get; set; }

    /// <summary>
    /// 关联申请ID
    /// </summary>
    public Guid? ApplicationId { get; set; }

    /// <summary>
    /// 是否已审核通过
    /// </summary>
    public bool IsApproved { get; set; }

    /// <summary>
    /// 是否為指定聯絡對象
    /// </summary>
    public bool IsDesignatedContact { get; set; }

    /// <summary>
    /// 是否已驗證信箱
    /// </summary>
    public bool IsEmailVerified { get; set; }

    /// <summary>
    /// 信箱驗證時間
    /// </summary>
    public DateTime? EmailVerifiedAt { get; set; }

    // Navigation properties
    public Picture? Photo { get; set; }
    public Person? Person { get; set; }
    public Company? Company { get; set; }
    public MemberApplication? Application { get; set; }
    public ICollection<MemberFavorite> Favorites { get; set; } = new List<MemberFavorite>();
    public ICollection<MemberDemand> MemberDemands { get; set; } = new List<MemberDemand>();
    public ICollection<ChatRecord> InitiatedChats { get; set; } = new List<ChatRecord>();
    public ICollection<ChatRecord> ReceivedChats { get; set; } = new List<ChatRecord>();
    public ICollection<Messages> Messages { get; set; } = new List<Messages>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Scoring> Scorings { get; set; } = new List<Scoring>();
}
