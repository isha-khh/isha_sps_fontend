namespace SPS.Application.DTOs.AdminUser;

public class UpdateAdminPermissionsRequest
{
    public List<Guid> RoleIds { get; set; } = new();
}
