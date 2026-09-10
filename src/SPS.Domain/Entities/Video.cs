using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Video : BaseEntity<int>
{
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public string? LinkUrl { get; set; }

    /// <summary>
    /// 前台要不要用站內燈箱嵌入播放（true）還是直接連到 <see cref="LinkUrl"/>／
    /// <see cref="Uri"/> 原始來源（false，開新分頁）。2026-09-10 加這個欄位是
    /// 因為 YouTube 這類外部影片能不能嵌入，取決於正式環境的 CSP
    /// （`frame-src`）有沒有放行對應網域——與其每次都要改前端程式碼去
    /// 開關嵌入行為，讓後台可以針對「這一支」影片個別決定，CSP 還沒
    /// 調好或這支影片來源不允許嵌入時，管理員可以直接關掉這支影片的
    /// 嵌入播放，不影響其他支。預設 `true`（沿用目前的行為）。
    /// </summary>
    public bool PlayOnSite { get; set; } = true;

    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Ordinal { get; set; }
    public int Height { get; set; }
    public int Width { get; set; }
    public int Dpi { get; set; }
    public string? Remark { get; set; }
    public int? AlbumId { get; set; }

    // Navigation properties
    public Album? Album { get; set; }
}
