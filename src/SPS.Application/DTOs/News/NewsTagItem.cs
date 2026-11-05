using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.News;

/// <summary>
/// 公告上綁的標籤（id + 名稱）。只有名稱的 Tags 沒辦法對回標籤本身，
/// 前台要做「點標籤篩選公告」（NewsQueryParameters.TagId）、後台編輯表單要預選標籤，
/// 都需要 id。
/// </summary>
public class NewsTagItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>標籤的徽章顏色（後台「標籤管理」設定）；三個顏色都沒設定時為 null，前台套預設藍色樣式</summary>
    public BadgeStyleDto? Badge { get; set; }
}
