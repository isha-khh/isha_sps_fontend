using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.PopupAnnouncement;

/// <summary>
/// 彈窗公告查詢參數
/// </summary>
public class PopupAnnouncementQueryParameters : QueryParameters
{
    public bool? Published { get; set; }
    public string? Route { get; set; }
}
