namespace SPS.Domain.Enums;

/// <summary>
/// 申請人類型 - 區分個人會員申請與企業會員申請，決定哪些企業相關欄位必填
/// </summary>
public enum ApplicantType
{
    /// <summary>
    /// 個人會員 - 不需要統一編號/企業名稱等企業專屬欄位
    /// </summary>
    Individual = 1,

    /// <summary>
    /// 企業會員 - 需求端或供給端
    /// </summary>
    Company = 2
}
