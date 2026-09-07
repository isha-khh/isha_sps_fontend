namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 郵件版面配置設定（Layout / Branding）
/// </summary>
public class EmailLayoutSettingsDto
{
    /// <summary>
    /// Logo 圖片 URL（支援完整 URL 或相對路徑如 /api/FileManagement/{id}/download）
    /// </summary>
    public string LogoUrl { get; set; } = string.Empty;

    /// <summary>
    /// Logo 最大寬度百分比
    /// </summary>
    public int LogoMaxWidthPercent { get; set; } = 70;

    /// <summary>
    /// 平台名稱（用於頁尾、標題等）
    /// </summary>
    public string PlatformName { get; set; } = "智慧石化產業資訊暨媒合平台";

    /// <summary>
    /// 主色（用於標題文字）
    /// </summary>
    public string PrimaryColor { get; set; } = "#333333";

    /// <summary>
    /// 內文文字色
    /// </summary>
    public string ContentColor { get; set; } = "#666666";

    /// <summary>
    /// 頁尾文字色
    /// </summary>
    public string FooterColor { get; set; } = "#999999";

    /// <summary>
    /// 頁尾文字（支援 HTML）
    /// </summary>
    public string FooterHtml { get; set; } = "此郵件由系統自動發送，請勿直接回覆。如有問題，請聯繫系統管理員。";

    /// <summary>
    /// 版權文字（顯示在最底部）
    /// </summary>
    public string CopyrightText { get; set; } = string.Empty;
}
