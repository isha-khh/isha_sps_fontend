namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 群發寄送模式
/// </summary>
public enum EmailSendMode
{
    /// <summary>同一封信 BCC 多人（無變數，最快）</summary>
    Bcc = 0,

    /// <summary>每人一封，支援變數替換（{{Name}}/{{CompanyName}} 等）</summary>
    PerRecipient = 1
}
