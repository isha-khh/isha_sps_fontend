namespace SPS.Application.DTOs.Common;

/// <summary>
/// 地址資料傳輸對象
/// </summary>
public class AddressDto
{
    public int Id { get; set; }
    public short Type { get; set; }
    public string? PostalCode { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Line { get; set; }
    public string? Description { get; set; }
}
