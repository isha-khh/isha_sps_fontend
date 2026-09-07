namespace SPS.Application.DTOs.AdminRole;

public class PermissionDto
{
    public string Name { get; set; } = string.Empty;
    public long Value { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
}
