using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class PasswordChangeLog : BaseEntity<long>
{
    public int Type { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? OldPassword { get; set; }
    public string? NewPassword { get; set; }
    public string? UserIp { get; set; }
}
