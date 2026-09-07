namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 退信處理設定
/// </summary>
public class BounceMailSettingsDto
{
    /// <summary>
    /// 是否啟用自動退信處理
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// IMAP 伺服器地址
    /// </summary>
    public string ImapServer { get; set; } = string.Empty;

    /// <summary>
    /// IMAP 端口（通常 993 for SSL, 143 for TLS）
    /// </summary>
    public int ImapPort { get; set; } = 993;

    /// <summary>
    /// 是否使用 SSL
    /// </summary>
    public bool UseSsl { get; set; } = true;

    /// <summary>
    /// 帳號
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密碼
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 要監控的信箱資料夾（預設 INBOX）
    /// </summary>
    public string Folder { get; set; } = "INBOX";

    /// <summary>
    /// 處理後是否刪除退信郵件
    /// </summary>
    public bool DeleteAfterProcessing { get; set; } = false;

    /// <summary>
    /// 處理後移動到的資料夾（若不刪除）
    /// </summary>
    public string? MoveToFolder { get; set; } = "Processed";

    /// <summary>
    /// 檢查間隔（分鐘）
    /// </summary>
    public int CheckIntervalMinutes { get; set; } = 5;
}
