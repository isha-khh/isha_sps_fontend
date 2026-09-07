using SPS.Domain.Enums;

namespace SPS.Application.DTOs.PopupAnnouncement;

/// <summary>
/// 彈窗公告響應
/// </summary>
public class PopupAnnouncementResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int? ImageId { get; set; }
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; }
    public List<string> Routes { get; set; } = new();
    public PopupFrequency Frequency { get; set; }
    public int Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool ShowCloseButton { get; set; }
    public bool ShowDontShowToday { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}

/// <summary>
/// 彈窗公告列表項響應
/// </summary>
public class PopupAnnouncementListItemResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Routes { get; set; } = new();
    public PopupFrequency Frequency { get; set; }
    public int Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public DateTime CreatedTime { get; set; }
}
