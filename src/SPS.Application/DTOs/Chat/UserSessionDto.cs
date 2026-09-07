namespace SPS.Application.DTOs.Chat;

/// <summary>
/// 用戶會話 DTO
/// </summary>
public class UserSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string? GaClientId { get; set; }
    public string CurrentUrl { get; set; } = string.Empty;
    public string? PageTitle { get; set; }
    public DateTime LastActiveTime { get; set; }
    public DateTime FirstConnectedTime { get; set; }
    public bool IsOnline { get; set; }
    public string? UtmTags { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public string Status { get; set; } = "active";
    public int UnreadMessageCount { get; set; }
}