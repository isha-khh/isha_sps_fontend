namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 安全性設定
/// </summary>
public class SecuritySettingsDto
{
    /// <summary>
    /// 是否啟用登入失敗鎖定機制
    /// </summary>
    public bool EnableLoginLockout { get; set; } = false;

    /// <summary>
    /// 最大登入失敗次數
    /// </summary>
    public int MaxFailedAttempts { get; set; } = 5;

    /// <summary>
    /// 鎖定時長（分鐘）
    /// </summary>
    public int LockoutDurationMinutes { get; set; } = 30;

    /// <summary>
    /// 是否強制首次登入修改密碼
    /// </summary>
    public bool RequirePasswordChangeOnFirstLogin { get; set; } = false;

    /// <summary>
    /// 是否啟用密碼過期策略
    /// </summary>
    public bool EnablePasswordExpiry { get; set; } = false;

    /// <summary>
    /// 密碼過期天數
    /// </summary>
    public int PasswordExpiryDays { get; set; } = 90;
}
