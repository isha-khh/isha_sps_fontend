namespace SPS.Application.DTOs.Product;

public class ProductListItemResponse
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ModelNo { get; set; }
    public string? Unit { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public bool Published { get; set; }
    public string? Photo { get; set; }
    public DateTime CreatedTime { get; set; }
}
