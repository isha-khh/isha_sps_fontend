using SPS.Domain.Enums;

namespace SPS.Application.DTOs.AdminUser;

public class UpdateAdminUserStatusRequest
{
    public Status Status { get; set; }
}
