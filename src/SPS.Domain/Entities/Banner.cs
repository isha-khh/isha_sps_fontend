using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Banner : BaseEntity<long>
{
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; } = "_self";
    public int ClickCount { get; set; }
    public int ViewCount { get; set; }
    public string? Remark { get; set; }
    public int? PositionId { get; set; }

    /// <summary>
    /// 主標題（首頁主視覺用；一般輪播圖不需要）
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// 副標題（首頁主視覺用）
    /// </summary>
    public string? Subtitle { get; set; }

    /// <summary>
    /// 說明文字（首頁主視覺用；換行代表分成多行顯示）
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 主按鈕文字（連結用 LinkUrl／LinkTarget）
    /// </summary>
    public string? ButtonText { get; set; }

    /// <summary>
    /// 第二顆按鈕文字
    /// </summary>
    public string? SecondaryButtonText { get; set; }

    /// <summary>
    /// 第二顆按鈕連結
    /// </summary>
    public string? SecondaryLinkUrl { get; set; }

    /// <summary>
    /// 同一版位內的排序，小的在前
    /// </summary>
    public int Ordinal { get; set; }

    /// <summary>
    /// 上架開始時間（含），沒填代表立即上架
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 上架結束時間（含），沒填代表不下架
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 是否上架；沒上架的 Banner 前台不會顯示（原本沒有這個欄位，既有資料視為上架）
    /// </summary>
    public bool Published { get; set; } = true;

    // Navigation properties
    public BannerPosition? Position { get; set; }
}
