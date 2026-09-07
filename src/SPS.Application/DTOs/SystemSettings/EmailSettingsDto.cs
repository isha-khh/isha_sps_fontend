namespace SPS.Application.DTOs.SystemSettings;

public class EmailSettingsDto
{
    /// <summary>
    /// 是否啟用郵件服務（關閉時不寄信不收信）
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    public string SmtpServer { get; set; } = string.Empty;
    public int Port { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public bool EnableSsl { get; set; }
}
