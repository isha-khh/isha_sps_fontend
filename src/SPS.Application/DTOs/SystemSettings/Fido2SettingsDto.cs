namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// FIDO2 Passkey 設定 DTO（存於 SystemSetting 資料庫）
/// </summary>
public class Fido2SettingsDto
{
    /// <summary>
    /// 前台會員是否啟用 Passkey 登入
    /// </summary>
    public bool EnableForMember { get; set; } = false;

    /// <summary>
    /// 後台管理員是否啟用 Passkey 登入
    /// </summary>
    public bool EnableForAdmin { get; set; } = false;

    /// <summary>
    /// 伺服器網域 (RP ID)，例如 isha.net
    /// </summary>
    public string? ServerDomain { get; set; }

    /// <summary>
    /// 伺服器名稱，例如 SPS Platform
    /// </summary>
    public string? ServerName { get; set; }

    /// <summary>
    /// 允許的來源清單，例如 ["https://sps.isha.net", "https://sps-admin.isha.net"]
    /// </summary>
    public List<string>? Origins { get; set; }
}
