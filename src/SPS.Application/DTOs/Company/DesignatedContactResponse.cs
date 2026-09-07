namespace SPS.Application.DTOs.Company;

/// <summary>
/// 指定聯絡人響應
/// </summary>
public class DesignatedContactResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? MemberJobTitle { get; set; }
}
