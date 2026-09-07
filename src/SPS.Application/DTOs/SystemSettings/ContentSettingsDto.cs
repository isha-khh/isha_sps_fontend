namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 內容設定
/// </summary>
public class ContentSettingsDto
{
    /// <summary>
    /// 訪客是否可以查看企業名錄詳情
    /// </summary>
    public bool GuestCanViewBusinessDetail { get; set; } = true;

    /// <summary>
    /// 企業列表是否顯示標籤
    /// </summary>
    public bool ShowBusinessListTags { get; set; } = true;

    /// <summary>
    /// 企業列表是否顯示關於我們
    /// </summary>
    public bool ShowBusinessListIntroduction { get; set; } = false;

    /// <summary>
    /// 企業列表關於我們最大顯示字元數
    /// </summary>
    public int BusinessListIntroductionMaxLength { get; set; } = 100;
}
