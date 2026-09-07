namespace SPS.Application.DTOs.Company;

/// <summary>
/// 設定企業標籤請求（覆寫該企業的企業標籤綁定，支援多個標籤）
/// </summary>
public class SetCompanyTagsRequest
{
    /// <summary>
    /// 要綁定的企業標籤 ID 集合；傳入空集合代表清除所有標籤
    /// </summary>
    public List<int> TagIds { get; set; } = new();
}
