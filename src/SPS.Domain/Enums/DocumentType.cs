namespace SPS.Domain.Enums;

/// <summary>
/// 文件類型（供給端/需求端）
/// </summary>
public enum DocumentType
{
    /// <summary>
    /// 公司登記證明文件（供給端、需求端共用 - 必填）
    /// </summary>
    CompanyRegistration = 1,

    /// <summary>
    /// 個人資料告知事項及同意書（供給端、需求端共用 - 必填）
    /// </summary>
    PersonalDataConsent = 2,

    /// <summary>
    /// 技術服務能量登錄證明（供給端專用 - 三選一）
    /// </summary>
    TechnicalCapability = 3,

    /// <summary>
    /// 云市集證明（供給端專用 - 四選一）
    /// </summary>
    CloudMarketplace = 4,

    /// <summary>
    /// 數字服務機構能量登錄證明（供給端專用 - 四選一）
    /// </summary>
    DigitalServiceCapability = 5,
    
    /// <summary>
    /// 一般申請書（供給端專用 - 四選一）
    /// </summary>
    Application = 6
}
