using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Company;

/// <summary>
/// 企業列表項響應
/// </summary>
public class CompanyListItemResponse
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? EnglishName { get; set; }
    public CompanyType Type { get; set; }
    public CompanyLevel Level { get; set; }
    public string? Subject { get; set; }
    public string? Introduction { get; set; }
    public int? Employees { get; set; }
    public Status Status { get; set; }
    public bool IsVerified { get; set; }
    public string? Photo { get; set; }
    public List<int> TagIds { get; set; } = new();
    public List<string> TagNames { get; set; } = new();
    public DateTime CreatedTime { get; set; }
}
