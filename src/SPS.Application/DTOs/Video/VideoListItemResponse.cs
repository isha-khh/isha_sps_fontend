namespace SPS.Application.DTOs.Video;

/// <summary>
/// 影片列表項目回應資料
/// </summary>
public class VideoListItemResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }

    /// <summary>
    /// 影片外部連結（例如 YouTube）——前台列表卡片點下去要連去哪裡就是
    /// 靠這個欄位，原本只有 <see cref="VideoResponse"/>（詳情）有帶，
    /// 列表卡片點擊需要它，一併補上（跟 News/SuccessCase 之前補
    /// ImageUrl／Tags 到列表 API 是同一種情況）。
    /// </summary>
    public string? LinkUrl { get; set; }

    /// <summary>
    /// 前台要不要用站內燈箱嵌入播放（`false` 直接連到 <see cref="LinkUrl"/>／
    /// `Uri` 原始來源，開新分頁）——列表卡片本身就要點下去決定行為，
    /// 一開始就直接放進列表 API，沒有像 `LinkUrl`／`Ordinal` 那樣是
    /// 後來才補的欄位落差。
    /// </summary>
    public bool PlayOnSite { get; set; }

    public bool Published { get; set; }

    /// <summary>
    /// 排序值——前台「精選影音」用這個欄位挑出要放在最顯眼位置的影片
    /// （數字最小的那支），原本只有 <see cref="VideoResponse"/> 有帶，
    /// 一併補上。
    /// </summary>
    public int Ordinal { get; set; }

    public int? AlbumId { get; set; }
    public string? AlbumTitle { get; set; }
    public DateTime CreatedTime { get; set; }
}