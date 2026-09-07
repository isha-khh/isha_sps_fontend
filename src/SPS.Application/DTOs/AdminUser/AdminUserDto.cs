using SPS.Domain.Enums;

namespace SPS.Application.DTOs.AdminUser;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public string? Email { get; set; }
    public Status Status { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? LastLoginTime { get; set; }
    public List<AdminRoleDto> Roles { get; set; } = new();
    public UserPermission Permissions { get; set; }
}

public class AdminRoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public UserPermission Permissions { get; set; }
}
