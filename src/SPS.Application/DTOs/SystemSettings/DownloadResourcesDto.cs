namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 前台各頁面「固定下載資源」的目錄：全站只有一份的檔案（會員申請須知、申請書、補助計畫文件…）或外部連結。
///
/// 目錄寫在程式裡（鍵值、說明、可用的檔案格式、seed 檔名）；後台「頁面設定 → 下載資源」只維護每一項
/// 目前是哪些檔案／哪個外部連結。要新增一個下載位置：在這裡加一筆、前台對應的位置用同一個 key 顯示。
/// </summary>
public static class DownloadResourceCatalog
{
    public static readonly DownloadResourceSlot[] Slots =
    {
        new("register-guide", "會員註冊", "會員申請須知", "會員註冊第一步（使用條款）與資訊填寫頁的「下載會員申請須知」",
            new[] { ".pdf" }, "register/member-guide", "115年智慧工安技術產業資訊暨媒合平台會員申請須知"),
        new("register-consent", "會員註冊", "附件一：蒐集個人資料告知事項暨個人資料同意書", "會員註冊第一步（使用條款）",
            new[] { ".docx", ".odt", ".pdf" }, "register/consent-form", "附件一、蒐集個人資料告知事項暨個人資料同意書"),
        new("register-application", "會員註冊", "附件二：登錄申請書", "會員註冊資訊填寫頁（供給端新興會員要上傳的申請書）",
            new[] { ".docx", ".odt", ".pdf" }, "register/application-form", "附件二、智慧工安技術產業資訊暨媒合平台登錄申請書"),
        new("register-review", "會員註冊", "附件三：供給端新興會員文件資料審查評定方式", "會員註冊資訊填寫頁（供給端新興會員）",
            new[] { ".docx", ".odt", ".pdf" }, "register/review-method", "附件三、供給端-新興會員文件資料審查評定方式"),

        new("support-leaflet", "補助專區", "補助懶人包", "補助專區 /support 下方的「補助懶人包」",
            new[] { ".pdf" }, "support/subsidy-leaflet", "115年智慧石化安全升級補助懶人包"),
        new("support-notice", "補助專區", "申請須知", "補助專區 /support 下方的「申請須知」",
            new[] { ".pdf" }, "support/subsidy-notice", "115年智慧石化安全升級補助計畫_申請須知"),
        new("support-plan", "補助專區", "計畫書格式", "補助專區 /support 下方的「計畫書格式」",
            new[] { ".docx", ".odt", ".pdf" }, "support/subsidy-plan-template", "115年智慧石化安全升級補助計畫_計畫申請書(格式)"),
        new("support-online-guide", "補助專區", "線上申請說明", "補助專區 /support 下方的「線上申請說明」",
            new[] { ".pdf" }, "support/subsidy-online-guide", "115智慧石化_線上申請操作說明"),
        new("support-qa", "補助專區", "常見問答", "補助專區 /support 下方的「常見問答」",
            new[] { ".pdf" }, "support/subsidy-qa", "QA(115年度)申請階段常見問答"),

        // 沒有檔案格式：只能設外部連結（安裝檔太大，通常放在雲端空間）
        new("support-apply-entry", "補助專區", "申請入口", "補助專區 /support 右側欄的「申請入口」按鈕（沒設定就不顯示）",
            Array.Empty<string>(), null, null),
        new("talent-xr", "人才培訓", "XR 訓練模組", "人才培訓 XR /talent/xr 下載區的「立即下載」",
            Array.Empty<string>(), null, null),
    };

    public static DownloadResourceSlot? Find(string key) =>
        Slots.FirstOrDefault(s => string.Equals(s.Key, key, StringComparison.Ordinal));
}

/// <param name="Key">識別碼，前台用同一個 key 取資料</param>
/// <param name="Group">後台分組</param>
/// <param name="Title">後台顯示名稱</param>
/// <param name="UsedAt">用在前台哪裡（給管理員看）</param>
/// <param name="Extensions">可以設定的檔案格式（含點，小寫）；空陣列＝只能設外部連結</param>
/// <param name="SeedPath">seed 檔案的相對路徑（不含副檔名），位於 wwwroot/seed/ 底下；沒有就不 seed</param>
/// <param name="DisplayName">seed 進來後，使用者下載到的檔名（不含副檔名）；磁碟上的檔名是英文，這裡是看得懂的中文名稱</param>
public sealed record DownloadResourceSlot(
    string Key, string Group, string Title, string UsedAt, string[] Extensions, string? SeedPath, string? DisplayName);

/// <summary>
/// 每個下載資源的設定（存在系統設定 "DownloadResources" 裡，鍵值是 <see cref="DownloadResourceSlot.Key"/>）。
/// 同時設了外部連結與檔案時，前台以外部連結為準。
/// </summary>
public class DownloadResourceEntryDto
{
    public Guid? DocxFileId { get; set; }
    public Guid? OdtFileId { get; set; }
    public Guid? PdfFileId { get; set; }

    /// <summary>外部連結（http／https）；空＝不使用</summary>
    public string ExternalUrl { get; set; } = string.Empty;

    // 內部欄位：部署時 seed 的版本標記（見 DownloadResourceSeeder），不出現在後台畫面與公開資料
    public string? DocxSeedHash { get; set; }
    public string? OdtSeedHash { get; set; }
    public string? PdfSeedHash { get; set; }

    public Guid? GetFileId(string extension) => extension switch
    {
        ".docx" => DocxFileId, ".odt" => OdtFileId, ".pdf" => PdfFileId, _ => null
    };

    public void SetFileId(string extension, Guid? id)
    {
        switch (extension)
        {
            case ".docx": DocxFileId = id; break;
            case ".odt": OdtFileId = id; break;
            case ".pdf": PdfFileId = id; break;
        }
    }

    public string? GetSeedHash(string extension) => extension switch
    {
        ".docx" => DocxSeedHash, ".odt" => OdtSeedHash, ".pdf" => PdfSeedHash, _ => null
    };

    public void SetSeedHash(string extension, string? hash)
    {
        switch (extension)
        {
            case ".docx": DocxSeedHash = hash; break;
            case ".odt": OdtSeedHash = hash; break;
            case ".pdf": PdfSeedHash = hash; break;
        }
    }
}

public class DownloadResourcesSettingsDto
{
    public Dictionary<string, DownloadResourceEntryDto> Items { get; set; } = new();
}

// ===== 後台 =====

/// <summary>後台儲存請求：只送要改的項目，沒出現的項目維持原樣</summary>
public class UpdateDownloadResourcesRequest
{
    public List<UpdateDownloadResourceItem> Items { get; set; } = new();
}

public class UpdateDownloadResourceItem
{
    public string Key { get; set; } = string.Empty;
    public Guid? DocxFileId { get; set; }
    public Guid? OdtFileId { get; set; }
    public Guid? PdfFileId { get; set; }
    public string ExternalUrl { get; set; } = string.Empty;
}

/// <summary>後台畫面用：目錄資訊 ＋ 目前設定 ＋ 目前選的檔案資訊</summary>
public class DownloadResourceAdminItemDto
{
    public string Key { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string UsedAt { get; set; } = string.Empty;

    /// <summary>可設定的檔案格式（docx／odt／pdf）；空陣列＝只能設外部連結</summary>
    public List<string> Formats { get; set; } = new();

    public Guid? DocxFileId { get; set; }
    public Guid? OdtFileId { get; set; }
    public Guid? PdfFileId { get; set; }
    public string ExternalUrl { get; set; } = string.Empty;

    /// <summary>目前選的檔案（檔案已被刪除或不可用時為 null，畫面顯示「尚未設定」）</summary>
    public DownloadFileDto? Docx { get; set; }
    public DownloadFileDto? Odt { get; set; }
    public DownloadFileDto? Pdf { get; set; }
}

// ===== 前台公開 =====

public class DownloadResourcePublicDto
{
    public string Title { get; set; } = string.Empty;

    /// <summary>可下載的選項：有外部連結就只有一個 link；否則依 Word、ODF、PDF 的順序列出有檔案的格式；沒有任何東西時是空陣列</summary>
    public List<DownloadLinkDto> Links { get; set; } = new();
}

public class DownloadLinkDto
{
    /// <summary>docx／odt／pdf／link（外部連結）</summary>
    public string Kind { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FormattedFileSize { get; set; } = string.Empty;
}

public class DownloadFileDto
{
    public string Kind { get; set; } = string.Empty;
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FormattedFileSize { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public static class DownloadResourceValidator
{
    private const int MaxUrlLength = 500;

    /// <summary>外部連結只接受 http／https（避免後台填入 javascript: 變成前台的 XSS）；空字串代表不使用</summary>
    public static string? ValidateExternalUrl(string slotTitle, string? url)
    {
        var v = url?.Trim() ?? string.Empty;
        if (v.Length == 0) return null;
        if (v.Length > MaxUrlLength) return $"「{slotTitle}」的外部連結太長（上限 {MaxUrlLength} 字元）";
        if (!Uri.TryCreate(v, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return $"「{slotTitle}」的外部連結必須是 http／https 網址";
        return null;
    }
}
