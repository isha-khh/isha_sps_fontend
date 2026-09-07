using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 群發郵件活動的附件（指向 FileManagement 中的檔案）
/// </summary>
public class EmailCampaignAttachment : BaseEntity<Guid>
{
    public Guid CampaignId { get; set; }

    /// <summary>
    /// FileManagement 中的檔案 ID
    /// </summary>
    public Guid FileId { get; set; }

    /// <summary>
    /// 顯示用檔名（寄出時 BodyBuilder.Attachments 使用）
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// MIME 類型；下載時若服務有回傳則覆蓋
    /// </summary>
    public string? ContentType { get; set; }

    /// <summary>
    /// 檔案大小（位元組），純為記錄
    /// </summary>
    public long FileSize { get; set; }

    public EmailCampaign? Campaign { get; set; }
}
