namespace SPS.Application.DTOs.AdminUser;

public class CreateAdminUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
    public List<Guid> RoleIds { get; set; } = new();
}
