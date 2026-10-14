using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.PopupAnnouncement;

/// <summary>
/// 新增彈窗公告請求
/// </summary>
public class CreatePopupAnnouncementRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }
    public int? ImageId { get; set; }

    /// <summary>圖片：檔案管理中的圖片檔案 Id（Controller 會檢查必須是可用的圖片）；系統會建立對應的圖片紀錄並填入 ImageId</summary>
    public Guid? CoverFileId { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; } = "_self";

    [Required]
    public List<string> Routes { get; set; } = new() { "/" };

    public PopupFrequency Frequency { get; set; } = PopupFrequency.OncePerSession;
    public int Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool ShowCloseButton { get; set; } = true;
    public bool ShowDontShowToday { get; set; } = true;
    public bool Published { get; set; }
    public int Ordinal { get; set; }
}
