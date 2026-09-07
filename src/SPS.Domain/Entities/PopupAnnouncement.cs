using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 彈窗公告
/// </summary>
public class PopupAnnouncement : BaseEntity<int>
{
    /// <summary>
    /// 標題
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 內容（HTML）
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// 圖片 ID
    /// </summary>
    public int? ImageId { get; set; }

    /// <summary>
    /// 點擊跳轉連結
    /// </summary>
    public string? LinkUrl { get; set; }

    /// <summary>
    /// 連結開啟方式 (_self / _blank)
    /// </summary>
    public string? LinkTarget { get; set; }

    /// <summary>
    /// 觸發路由（JSON array: ["/", "/products"]）
    /// </summary>
    public string Routes { get; set; } = "[\"/\"]";

    /// <summary>
    /// 顯示頻率
    /// </summary>
    public PopupFrequency Frequency { get; set; } = PopupFrequency.OncePerSession;

    /// <summary>
    /// 優先順序（數字小優先）
    /// </summary>
    public int Priority { get; set; }

    /// <summary>
    /// 生效開始時間
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 生效結束時間
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 是否顯示關閉按鈕
    /// </summary>
    public bool ShowCloseButton { get; set; } = true;

    /// <summary>
    /// 是否顯示「今日不再顯示」選項
    /// </summary>
    public bool ShowDontShowToday { get; set; } = true;

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool Published { get; set; }

    /// <summary>
    /// 排序
    /// </summary>
    public int Ordinal { get; set; }

    // Navigation properties
    public Picture? Image { get; set; }
}
