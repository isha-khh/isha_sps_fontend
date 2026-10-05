namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 「我要投稿」頁（前台 /promotion/contribute）的頁面設定，後台「內容管理 → 頁面設定」維護。
///
/// 投稿格式檔存的是檔案管理系統裡的檔案 id（不是網址）：檔案改名、搬資料夾都不影響，
/// 檔案被刪掉前台就自動不顯示那個格式，不會留下 404 的下載連結。
/// </summary>
public class ContributePageSettingsDto
{
    /// <summary>投稿格式（ODF 文件格式，副檔名 .odt）在檔案管理系統裡的檔案 id；空＝沒有提供</summary>
    public Guid? OdtFileId { get; set; }

    /// <summary>投稿格式（PDF，副檔名 .pdf）在檔案管理系統裡的檔案 id；空＝沒有提供</summary>
    public Guid? PdfFileId { get; set; }

    /// <summary>投稿聯絡人姓名；空＝前台不顯示這一列</summary>
    public string ContactName { get; set; } = string.Empty;

    /// <summary>投稿聯絡電話；空＝前台不顯示這一列</summary>
    public string ContactPhone { get; set; } = "+886-7-550-3115";

    /// <summary>投稿信箱；空＝前台不顯示這一列</summary>
    public string ContactEmail { get; set; } = "isha_khh@mail.isha.org.tw";
}

/// <summary>
/// 後台編輯畫面用：設定值加上目前選的檔案資訊（檔名、大小），畫面才能顯示「目前是哪個檔案」。
/// 檔案已被刪除或不存在時，<see cref="Odt"/>／<see cref="Pdf"/> 為 null，畫面就會顯示「尚未設定」。
/// </summary>
public class ContributePageAdminDto
{
    public ContributePageSettingsDto Settings { get; set; } = new();
    public ContributeFormatFileDto? Odt { get; set; }
    public ContributeFormatFileDto? Pdf { get; set; }
}

/// <summary>
/// 前台公開資料：只含可下載的格式與聯絡資訊
/// </summary>
public class ContributePagePublicDto
{
    /// <summary>可下載的投稿格式；沒有任何格式時是空陣列</summary>
    public List<ContributeFormatFileDto> Formats { get; set; } = new();

    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
}

public class ContributeFormatFileDto
{
    /// <summary>odt／pdf</summary>
    public string Kind { get; set; } = string.Empty;

    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FormattedFileSize { get; set; } = string.Empty;

    /// <summary>下載網址（相對於 API，例如 /api/FileManagement/{id}/download）</summary>
    public string Url { get; set; } = string.Empty;
}

public static class ContributePageValidator
{
    /// <summary>
    /// 回傳錯誤訊息；沒有問題回 null。檔案本身（存在、副檔名）的檢查在 controller（需要查檔案服務）
    /// </summary>
    public static string? ValidateContact(ContributePageSettingsDto s)
    {
        var name = s.ContactName?.Trim() ?? string.Empty;
        if (name.Length > 50) return "「聯絡人」太長（上限 50 字元）";

        var phone = s.ContactPhone?.Trim() ?? string.Empty;
        if (phone.Length > 0 && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^[0-9+\-()#\s]{3,30}$"))
            return "「聯絡電話」只能包含數字與 + - ( ) # 空白，長度 3～30";

        var email = s.ContactEmail?.Trim() ?? string.Empty;
        if (email.Length > 0 &&
            (email.Length > 320 || !System.Net.Mail.MailAddress.TryCreate(email, out var parsed) || parsed.Address != email))
            return "「投稿信箱」格式不正確";

        return null;
    }

    public static ContributePageSettingsDto Normalize(ContributePageSettingsDto s) => new()
    {
        OdtFileId = s.OdtFileId,
        PdfFileId = s.PdfFileId,
        ContactName = s.ContactName?.Trim() ?? string.Empty,
        ContactPhone = s.ContactPhone?.Trim() ?? string.Empty,
        ContactEmail = s.ContactEmail?.Trim() ?? string.Empty,
    };
}
