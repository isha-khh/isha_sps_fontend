using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Scoring;

/// <summary>
/// 新增一筆專家評分請求（新興會員委員審查用，一位專家一筆）
/// </summary>
public class AddExpertScoreRequest
{
    /// <summary>
    /// 外部專家姓名（自由文字，專家沒有後台帳號）
    /// </summary>
    [Required(ErrorMessage = "專家姓名不能為空")]
    [MaxLength(100, ErrorMessage = "專家姓名長度不能超過100個字符")]
    public string ExpertName { get; set; } = string.Empty;

    /// <summary>
    /// 人力資源（權重 20%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal HumanResourcesScore { get; set; }

    /// <summary>
    /// 團隊學經歷（權重 20%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal TeamExperienceScore { get; set; }

    /// <summary>
    /// 相關經驗（權重 20%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal RelevantExperienceScore { get; set; }

    /// <summary>
    /// 財務制度（權重 10%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal FinancialSystemScore { get; set; }

    /// <summary>
    /// 產品實績（權重 20%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal ProductTrackRecordScore { get; set; }

    /// <summary>
    /// 財務狀況（權重 10%，0-100 分）
    /// </summary>
    [Range(0, 100, ErrorMessage = "分數必須介於 0-100")]
    public decimal FinancialStatusScore { get; set; }
}
