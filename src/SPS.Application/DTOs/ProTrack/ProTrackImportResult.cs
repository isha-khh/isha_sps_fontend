namespace SPS.Application.DTOs.ProTrack;

public class ProTrackImportResult
{
    public string SubmissionId { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Consultant { get; set; } = string.Empty;
    public string SuggestedName { get; set; } = string.Empty;
    public string SuggestedIntroduction { get; set; } = string.Empty;
    public Guid? MatchedCompanyId { get; set; }
    public string? MatchedCompanyName { get; set; }
    public List<int> SuggestedTagIds { get; set; } = new();
    public List<string> SuggestedTagNames { get; set; } = new();
}
