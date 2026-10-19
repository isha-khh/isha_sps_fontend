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

    /// <summary>換圖片：檔案管理中的圖片檔案 Id；沒帶（null）= 不更新</summary>
    public Guid? CoverFileId { get; set; }

    /// <summary>true = 移除圖片（優先於 <see cref="CoverFileId"/>）</summary>
    public bool? RemoveCover { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; }
    public List<string>? Routes { get; set; }
    public PopupFrequency? Frequency { get; set; }
    public int? Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>true＝清除開始日期（日期沒帶代表「不更新」，所以要清掉得另外說明）</summary>
    public bool? ClearStartDate { get; set; }

    /// <summary>true＝清除結束日期</summary>
    public bool? ClearEndDate { get; set; }
    public bool? ShowCloseButton { get; set; }
    public bool? ShowDontShowToday { get; set; }
    public bool? Published { get; set; }
    public int? Ordinal { get; set; }
}
