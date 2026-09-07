namespace SPS.Application.DTOs.Product;

public class ProductQueryParameters
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public Guid? CompanyId { get; set; }
    public bool? Published { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool Descending { get; set; } = true;
}
