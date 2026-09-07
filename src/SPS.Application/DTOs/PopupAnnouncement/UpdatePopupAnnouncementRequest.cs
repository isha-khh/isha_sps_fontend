using SPS.Domain.Enums;

namespace SPS.Application.DTOs.PopupAnnouncement;

/// <summary>
/// 更新彈窗公告請求
/// </summary>
public class UpdatePopupAnnouncementRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public int? ImageId { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; }
    public List<string>? Routes { get; set; }
    public PopupFrequency? Frequency { get; set; }
    public int? Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? ShowCloseButton { get; set; }
    public bool? ShowDontShowToday { get; set; }
    public bool? Published { get; set; }
    public int? Ordinal { get; set; }
}
