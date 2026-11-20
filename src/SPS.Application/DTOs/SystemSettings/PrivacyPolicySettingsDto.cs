using System.Text.RegularExpressions;

namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 隱私權政策頁（前台 /privacy）與第一次造訪的 Cookie 告知橫幅，後台「內容管理 → 頁面設定」維護。
/// 政策內容是「區塊清單」（每個區塊＝標題＋內文），全部存純文字、前台用 React 逐段輸出，不用 HTML，所以沒有注入問題。
/// 內文規則：空一行＝新段落；以「- 」或「• 」開頭的行＝項目符號；網址（http／https）與電子郵件自動變成連結。
/// 沒有設定過時就是這裡的預設值（通用範本，<b>需由客戶或法務確認後再上線</b>）。
/// </summary>
public class PrivacyPolicySettingsDto
{
    /// <summary>政策頁標題</summary>
    public string Title { get; set; } = "隱私權政策";

    /// <summary>最後更新日期（<c>yyyy-MM-dd</c>）；空白＝前台不顯示</summary>
    public string UpdatedDate { get; set; } = string.Empty;

    /// <summary>政策內容區塊，依顯示順序</summary>
    public List<PrivacySectionDto> Sections { get; set; } = PrivacyPolicyDefaults.Sections();

    /// <summary>是否顯示第一次造訪的 Cookie 告知橫幅</summary>
    public bool NoticeEnabled { get; set; } = true;

    /// <summary>橫幅文字</summary>
    public string NoticeMessage { get; set; } = "本網站使用 Cookie 統計流量，以改善瀏覽體驗。繼續瀏覽即表示您了解並接受。";

    /// <summary>橫幅按鈕文字（按下後記住，不再顯示）</summary>
    public string NoticeButtonText { get; set; } = "我知道了";

    /// <summary>橫幅上連到隱私權政策頁的連結文字</summary>
    public string NoticeLinkText { get; set; } = "了解隱私權政策";
}

public class PrivacySectionDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public static class PrivacyPolicyDefaults
{
    /// <summary>通用範本：個資蒐集、Cookie 與流量分析、保存、權利、聯絡。內容僅供起點，上線前請客戶或法務確認</summary>
    public static List<PrivacySectionDto> Sections() => new()
    {
        new()
        {
            Title = "一、適用範圍",
            Body = "本隱私權政策說明智慧工安技術產業資訊暨媒合平台（以下稱「本平台」）如何蒐集、處理、利用您的個人資料與瀏覽資訊。\n\n當您瀏覽或使用本平台，即表示您已閱讀並了解本政策。",
        },
        new()
        {
            Title = "二、蒐集的資料與目的",
            Body = "本平台可能蒐集下列資料：\n\n- 您主動提供的資料：註冊會員、填寫申請表單、索取資料、聯繫諮詢或訂閱電子報時填寫的姓名、公司、聯絡電話、電子郵件等。\n- 瀏覽時自動產生的資料：瀏覽器與裝置類型、瀏覽的頁面、造訪時間、來源網址與 IP 位址等。\n\n這些資料僅用於會員服務、媒合與諮詢聯繫、寄送您訂閱的資訊、網站安全與維運，以及統計與改善網站服務。",
        },
        new()
        {
            Title = "三、Cookie 與流量分析",
            Body = "為了解網站使用情形，本平台可能使用 Cookie 與 Google Analytics 等工具統計造訪人次、瀏覽頁面與使用來源。這些資料是以統計為目的的匯總資訊，不會用來識別您個人身分，也不會用於廣告投放。\n\n您可以透過瀏覽器設定拒絕或刪除 Cookie，但部分功能（例如登入）可能因此無法正常使用。",
        },
        new()
        {
            Title = "四、資料的利用與提供",
            Body = "本平台不會將您的個人資料出售、出租或交換給第三方。除下列情形外，不會向第三方提供您的個人資料：\n\n- 經您同意（例如您主動要求將資料提供給特定企業或單位）。\n- 依法令規定或主管機關、司法機關依法要求。\n- 為維護本平台與使用者的安全所必需。",
        },
        new()
        {
            Title = "五、資料的保存與安全",
            Body = "本平台採取合理的技術與管理措施保護您的資料，避免遭到未經授權的存取、竄改或洩漏。個人資料僅在達成蒐集目的所需期間內保存，或依法令規定的期間保存。",
        },
        new()
        {
            Title = "六、您的權利",
            Body = "就您提供給本平台的個人資料，您可以依個人資料保護法請求查詢、閱覽、製給複製本、補充或更正、停止蒐集處理利用，或請求刪除。如需行使上述權利，請透過下方聯絡方式與我們聯繫。",
        },
        new()
        {
            Title = "七、外部連結",
            Body = "本平台可能提供連結至其他網站。這些網站有各自的隱私權政策，本平台無法控制也不負責其內容與做法，請於瀏覽前自行了解。",
        },
        new()
        {
            Title = "八、政策的修訂",
            Body = "本平台可能因法令或服務調整而修訂本政策，修訂後會公告於本頁並更新「最後更新」日期，請您不定期查閱。",
        },
        new()
        {
            Title = "九、聯絡我們",
            Body = "對本政策或您的個人資料有任何疑問，請透過本平台頁尾所列的聯絡資訊與我們聯繫。",
        },
    };
}

public static class PrivacyPolicyValidator
{
    private const int MaxSections = 30;
    private const int MaxTitleLength = 100;
    private const int MaxBodyLength = 5000;
    private static readonly Regex DatePattern = new(@"^\d{4}-\d{2}-\d{2}$", RegexOptions.Compiled);

    private static string Clean(string? value) => (value ?? string.Empty).Trim();

    private static string CleanBody(string? value) =>
        (value ?? string.Empty).Replace("\r\n", "\n").Replace('\r', '\n').Trim();

    /// <summary>驗證並整理：去頭尾空白、丟掉整個空白的區塊、檢查長度與日期格式</summary>
    public static (PrivacyPolicySettingsDto Settings, string? Error) Normalize(PrivacyPolicySettingsDto input)
    {
        var s = new PrivacyPolicySettingsDto
        {
            Title = Clean(input.Title),
            UpdatedDate = Clean(input.UpdatedDate),
            NoticeEnabled = input.NoticeEnabled,
            NoticeMessage = Clean(input.NoticeMessage),
            NoticeButtonText = Clean(input.NoticeButtonText),
            NoticeLinkText = Clean(input.NoticeLinkText),
            Sections = new(),
        };

        if (s.Title.Length == 0) return (s, "請填寫政策頁標題");
        if (s.Title.Length > MaxTitleLength) return (s, $"政策頁標題太長（上限 {MaxTitleLength} 字）");
        if (s.UpdatedDate.Length > 0 && (!DatePattern.IsMatch(s.UpdatedDate) || !DateTime.TryParse(s.UpdatedDate, out _)))
            return (s, "最後更新日期格式必須是 yyyy-MM-dd");

        if (s.NoticeEnabled)
        {
            if (s.NoticeMessage.Length == 0) return (s, "開啟 Cookie 橫幅時，請填寫橫幅文字");
            if (s.NoticeButtonText.Length == 0) return (s, "開啟 Cookie 橫幅時，請填寫按鈕文字");
        }
        if (s.NoticeMessage.Length > 300) return (s, "橫幅文字太長（上限 300 字）");
        if (s.NoticeButtonText.Length > 20) return (s, "按鈕文字太長（上限 20 字）");
        if (s.NoticeLinkText.Length > 30) return (s, "連結文字太長（上限 30 字）");

        var sections = (input.Sections ?? new()).Where(x => x != null).ToList();
        foreach (var section in sections)
        {
            var title = Clean(section.Title);
            var body = CleanBody(section.Body);
            if (title.Length == 0 && body.Length == 0) continue; // 整個區塊空白就丟掉
            if (title.Length == 0) return (s, "每個區塊都要填標題");
            if (title.Length > MaxTitleLength) return (s, $"區塊標題「{title[..20]}…」太長（上限 {MaxTitleLength} 字）");
            if (body.Length > MaxBodyLength) return (s, $"區塊「{title}」內文太長（上限 {MaxBodyLength} 字）");
            s.Sections.Add(new PrivacySectionDto { Title = title, Body = body });
        }
        if (s.Sections.Count > MaxSections) return (s, $"政策區塊最多 {MaxSections} 個");
        if (s.Sections.Count == 0) return (s, "請至少保留一個政策區塊");

        return (s, null);
    }
}
