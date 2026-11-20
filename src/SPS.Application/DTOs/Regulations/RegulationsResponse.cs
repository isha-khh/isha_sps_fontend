namespace SPS.Application.DTOs.Regulations;

public class RegulationsResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public bool Published { get; set; }

    /// <summary>被內容檢查自動轉成草稿的原因；沒有則為 null（後台表單用來顯示提示）</summary>
    public string? UnpublishReason { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
