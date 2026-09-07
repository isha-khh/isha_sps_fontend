using System.Text.Json.Serialization;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.AdminRole;

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>
    /// 權限值 - 接受字串或數字 (為了支援 JavaScript BigInt)
    /// </summary>
    [JsonConverter(typeof(PermissionJsonConverter))]
    public UserPermission Permissions { get; set; }
}
