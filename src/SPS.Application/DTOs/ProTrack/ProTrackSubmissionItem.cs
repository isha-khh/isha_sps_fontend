namespace SPS.Application.DTOs.ProTrack;

public class ProTrackSubmissionItem
{
    public string Id { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Consultant { get; set; } = string.Empty;
    public string SubmittedBy { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public int RecommendationCount { get; set; }
    public string Summary { get; set; } = string.Empty;
}
