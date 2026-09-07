namespace SPS.Application.DTOs.Log;

/// <summary>
/// 記錄退信請求
/// </summary>
public class RecordBounceRequest
{
    /// <summary>
    /// 收件人郵箱地址
    /// </summary>
    public string RecipientEmail { get; set; } = string.Empty;

    /// <summary>
    /// 退信類型：HardBounce（永久失敗）或 SoftBounce（暫時失敗）
    /// </summary>
    public string BounceType { get; set; } = "HardBounce";

    /// <summary>
    /// 退信錯誤代碼（如 5.1.1）
    /// </summary>
    public string? BounceCode { get; set; }

    /// <summary>
    /// 退信原因描述
    /// </summary>
    public string? BounceReason { get; set; }

    /// <summary>
    /// 遠端 MTA
    /// </summary>
    public string? RemoteMta { get; set; }

    /// <summary>
    /// 退信時間（若未提供則使用當前時間）
    /// </summary>
    public DateTime? BounceTime { get; set; }

    /// <summary>
    /// 原始郵件的 Message-ID（可選，用於精確匹配）
    /// </summary>
    public string? OriginalMessageId { get; set; }
}
