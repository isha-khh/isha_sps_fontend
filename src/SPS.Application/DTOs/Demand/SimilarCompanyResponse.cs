namespace SPS.Application.DTOs.Demand;

public class SimilarCompanyResponse
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? ChargeEmail { get; set; }
    public int MatchCount { get; set; }
    public int DemandTagCount { get; set; }
    public int CompanyTagCount { get; set; }
    public double OverlapPercent { get; set; }
    public List<string> MatchedTagNames { get; set; } = new();
}
