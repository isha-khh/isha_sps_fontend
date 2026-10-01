namespace SPS.Domain.Enums;

/// <summary>
/// 企業會員分級 - 2026-10-01 改名對齊官方規劃書的「卓越/新興」審查路徑
/// 記錄，不是權限/功能分級（Excellent 跟 Emerging 功能完全相同，差別
/// 只是當初審核時走哪條路徑：卓越=已有政府資格驗證，新興=委員評分審查）
/// </summary>
public enum CompanyLevel : short
{
    /// <summary>
    /// 一般 - 需求端企業預設值，沒有分級概念
    /// </summary>
    Standard = 0,

    /// <summary>
    /// 卓越會員（供給端）- 已具備技術服務能量登錄/雲市集/數位服務機構
    /// 登錄資格之一，只需文件審查
    /// </summary>
    Excellent = 1,

    /// <summary>
    /// 新興會員（供給端）- 尚未具備上述資格，需經 ≥5 位外部專家委員評分
    /// 審查（見 Scoring）
    /// </summary>
    Emerging = 2
}
