namespace SPS.Domain.Enums;

/// <summary>
/// 內容所屬專區（存在 <c>News.Section</c>）：公告與服務專區共用同一張資料表與後台編輯畫面，用這個值區分。
/// 公告頁與服務專區頁各自只列自己的專區。<b>不是 <c>News.Type</c></b>——那個欄位是公告的「一般／重要／緊急」。
/// 人才培育、產業輔導、補助專區也沿用同一張表；各專區的專屬欄位（講師、主辦單位…）放在 <c>News.Meta</c>，
/// 允許的欄位名稱見 <see cref="MetaKeys"/>。
/// </summary>
public static class NewsSection
{
    /// <summary>公告事項（舊資料的預設值）</summary>
    public const short Announcement = 0;

    /// <summary>服務專區</summary>
    public const short Serve = 1;

    /// <summary>補助專區的「本計畫補助」公告</summary>
    public const short Support = 2;

    /// <summary>人才培育課程</summary>
    public const short Talent = 3;

    /// <summary>產業輔導</summary>
    public const short Tutoring = 4;

    /// <summary>政府補助資源（卡片列表，點「索取資料協助評估」留資料）</summary>
    public const short SupportResource = 5;

    /// <summary>各專區 <c>News.Meta</c> 允許的欄位名稱；其他欄位名稱後端一律拒絕</summary>
    public static readonly IReadOnlyDictionary<short, string[]> MetaKeys = new Dictionary<short, string[]>
    {
        // 公告的活動資訊：列表卡片上的時間與地點（設計稿 page/news/index.html 的 calendar／geo 兩列），兩個都選填
        [Announcement] = new[] { "eventTime", "location" },
        [Talent] = new[]
        {
            "organizer", "dateStart", "dateEnd", "city", "contactName", "contactPhone", "courseCode", "courseDate", "courseTime",
            "totalHours", "fee", "audience", "location", "hostOrganizer", "coOrganizer", "executor", "registerUrl",
            // 熱門課程排序：有填整數（數字越小越前面）就列入前台「熱門課程」側欄，沒填就不列入
            "popularOrder",
        },
        [Tutoring] = new[] { "applicant", "organizer", "contactPhone", "contributor" },
        [SupportResource] = new[] { "applicant", "amount", "organizer", "period" },
    };

    /// <summary>
    /// 已經停用的欄位：舊資料裡還有，編輯舊項目時前端會原樣送回來，所以不拒絕、而是靜默丟掉（存檔後就清掉了）。
    /// 人才培育的「剩餘名額」（remainingSeats）2026-11 起不再維護、前台也不顯示。
    /// </summary>
    public static readonly IReadOnlyDictionary<short, string[]> RetiredMetaKeys = new Dictionary<short, string[]>
    {
        [Talent] = new[] { "remainingSeats" },
    };

    public static bool IsValid(short section) => section is >= Announcement and <= SupportResource;
}
