namespace SPS.Domain.Enums;

/// <summary>
/// 內容所屬專區（存在 <c>News.Section</c>）：公告與服務專區共用同一張資料表與後台編輯畫面，用這個值區分。
/// 公告頁與服務專區頁各自只列自己的專區。<b>不是 <c>News.Type</c></b>——那個欄位是公告的「一般／重要／緊急」。
/// 之後其他專區（產業輔導等）沿用時在這裡加值。
/// </summary>
public static class NewsSection
{
    /// <summary>公告事項（舊資料的預設值）</summary>
    public const short Announcement = 0;

    /// <summary>服務專區</summary>
    public const short Serve = 1;
}
