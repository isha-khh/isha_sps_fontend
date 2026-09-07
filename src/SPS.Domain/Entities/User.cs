using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class User : BaseEntity<Guid>
{
    public DataMode DataMode { get; set; }
    public int? PhotoId { get; set; }
    public Guid? AvatarFileId { get; set; }
    public Guid? PersonId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int PasswordExpirationPolicy { get; set; }
    public DateTime? PasswordChangedTime { get; set; }
    public string? Email { get; set; }
    public string? Token { get; set; }
    public DateTime? LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public DateTime? LastVisitedTime { get; set; }
    public string? Remark { get; set; }
    public Status Status { get; set; }
    public DateTime? LockedTime { get; set; }
    public int LoginFailure { get; set; }
    public bool PasswordChanged { get; set; }
    public bool FirstChanged { get; set; }

    // Navigation properties
    public Picture? Photo { get; set; }
    public UploadedFile? AvatarFile { get; set; }
    public Person? Person { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<ChatRecord> InitiatedChats { get; set; } = new List<ChatRecord>();
    public ICollection<ChatRecord> ReceivedChats { get; set; } = new List<ChatRecord>();
    public ICollection<RelationLink> RelationLinks { get; set; } = new List<RelationLink>();
    public ICollection<Messages> Messages { get; set; } = new List<Messages>();
}
