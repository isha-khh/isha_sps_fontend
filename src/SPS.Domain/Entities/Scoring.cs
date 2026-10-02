using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 評分紀錄 - 2026-10-01 擴充為新興會員委員評分用：一位外部專家評分
/// 一筆，由內部帳號（EnteredByUserId）代為輸入（專家本身沒有後台帳號）。
/// 原本單一 Score 欄位拆成 6 個加權子分數，保留 Score 欄位但新流程不再
/// 使用，避免動到既有 migration 歷史。
/// </summary>
public class Scoring : BaseEntity<long>
{
    public long? DocumentId { get; set; }
    public Guid? SubmitterId { get; set; }
    public Guid? CompanyId { get; set; }
    public string? Remark { get; set; }

    /// <summary>
    /// 舊欄位，新的委員評分流程不再使用，保留供歷史資料相容
    /// </summary>
    public decimal? Score { get; set; }

    /// <summary>
    /// 關聯的會員申請（新興會員委員評分掛在申請階段，不是掛在已核准的公司上）
    /// </summary>
    public Guid? ApplicationId { get; set; }

    /// <summary>
    /// 外部專家姓名（自由文字，專家沒有後台帳號）
    /// </summary>
    public string? ExpertName { get; set; }

    /// <summary>
    /// 代為輸入這筆評分的內部帳號
    /// </summary>
    public Guid? EnteredByUserId { get; set; }

    /// <summary>
    /// 人力資源（權重 20%）
    /// </summary>
    public decimal? HumanResourcesScore { get; set; }

    /// <summary>
    /// 團隊學經歷（權重 20%）
    /// </summary>
    public decimal? TeamExperienceScore { get; set; }

    /// <summary>
    /// 相關經驗（權重 20%）
    /// </summary>
    public decimal? RelevantExperienceScore { get; set; }

    /// <summary>
    /// 財務制度（權重 10%）
    /// </summary>
    public decimal? FinancialSystemScore { get; set; }

    /// <summary>
    /// 產品實績（權重 20%）
    /// </summary>
    public decimal? ProductTrackRecordScore { get; set; }

    /// <summary>
    /// 財務狀況（權重 10%）
    /// </summary>
    public decimal? FinancialStatusScore { get; set; }

    // Navigation properties
    public Document? Document { get; set; }
    public Member? Submitter { get; set; }
    public Company? Company { get; set; }
    public MemberApplication? Application { get; set; }
    public User? EnteredByUser { get; set; }
}
