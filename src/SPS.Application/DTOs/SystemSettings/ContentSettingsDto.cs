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

    /// <summary>
    /// 媒合對接：後台發布需求時，預設勾選通知的供應業者「標籤符合度」門檻（百分比，0–100）。只有系統管理員能改。
    /// </summary>
    public int DemandMatchThresholdPercent { get; set; } = 70;
}
