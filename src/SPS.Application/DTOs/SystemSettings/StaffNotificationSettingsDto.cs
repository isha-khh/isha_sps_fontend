namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 承辦人員通知設定（存於 SystemSetting，category = "StaffNotification"）：前台有新的詢問單（提案、下載申請、索取補助資料）
/// 或會員刊登需求時，寄信給這裡設定的收件信箱。
/// </summary>
public class StaffNotificationSettingsDto
{
    /// <summary>是否啟用寄信通知（預設關閉，要先設定收件信箱並開啟）</summary>
    public bool Enabled { get; set; }

    /// <summary>收件信箱（最多 10 個）</summary>
    public List<string> Recipients { get; set; } = new();
}
