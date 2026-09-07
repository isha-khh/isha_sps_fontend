using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 後台使用者角色
/// </summary>
public class Role : BaseEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public DataMode DataMode { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// 權限值（使用 Flags 枚舉）
    /// </summary>
    public UserPermission Permissions { get; set; }

    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
