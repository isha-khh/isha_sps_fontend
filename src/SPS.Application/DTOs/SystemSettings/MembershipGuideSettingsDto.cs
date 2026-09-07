namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 會員申請須知設定（申請須知附件下載連結）
/// </summary>
public class MembershipGuideSettingsDto
{
    /// <summary>
    /// 石化產業智慧化媒合與應用服務申請須知（PDF）檔案下載連結
    /// </summary>
    public string? GuidePdfFileUrl { get; set; }

    /// <summary>
    /// 申請須知 PDF 顯示名稱
    /// </summary>
    public string? GuidePdfFileName { get; set; }

    /// <summary>
    /// 可編輯申請須知附件（DOCX）檔案下載連結
    /// </summary>
    public string? GuideDocxFileUrl { get; set; }

    /// <summary>
    /// 申請須知附件 DOCX 顯示名稱
    /// </summary>
    public string? GuideDocxFileName { get; set; }
}
