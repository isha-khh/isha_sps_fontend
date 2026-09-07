namespace SPS.Application.DTOs.Chat;

/// <summary>
/// 訪客頁面瀏覽記錄 DTO
/// </summary>
public class VisitorPageViewDto
{
    public Guid Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public DateTime ViewTime { get; set; }
    public int? DurationSeconds { get; set; }
    public string? ReferrerUrl { get; set; }
}