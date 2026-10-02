namespace SPS.Application.DTOs.Scoring;

/// <summary>
/// 單一專家的評分結果（6 子分數依權重加總後的總分）
/// </summary>
public class ExpertScoreResult
{
    public long ScoringId { get; set; }
    public string ExpertName { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public bool IsQualified { get; set; }
}

/// <summary>
/// 一張申請的委員評分彙總結果
/// </summary>
public class ScoringSummaryResponse
{
    /// <summary>
    /// 每位專家的評分結果
    /// </summary>
    public List<ExpertScoreResult> Experts { get; set; } = new();

    /// <summary>
    /// 合格人數（總分 >= 70 分）
    /// </summary>
    public int QualifiedCount { get; set; }

    /// <summary>
    /// 已評分總人數
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 是否通過（合格人數達半數（含）以上）
    /// </summary>
    public bool IsPassed { get; set; }
}
