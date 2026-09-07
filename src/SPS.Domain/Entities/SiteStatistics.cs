namespace SPS.Domain.Entities;

/// <summary>
/// 網站統計數據（手動設定）
/// </summary>
public class SiteStatistics
{
    public int Id { get; set; }

    /// <summary>
    /// 會員總數
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// 媒合成功案例
    /// </summary>
    public int SuccessfulMatches { get; set; }

    /// <summary>
    /// 媒合補助申請案次
    /// </summary>
    public int SubsidyApplications { get; set; }

    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedTime { get; set; }
}
