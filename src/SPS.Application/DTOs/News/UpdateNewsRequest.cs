namespace SPS.Application.DTOs.News;

/// <summary>
/// 更新新聞請求
/// </summary>
public class UpdateNewsRequest
{
    public string? Title { get; set; }
    public string? Introduction { get; set; }
    public string? Content { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>true＝清除開始日期（<see cref="StartDate"/> 沒帶代表「不更新」，所以要清掉得另外說明）</summary>
    public bool? ClearStartDate { get; set; }

    /// <summary>true＝清除結束日期（同 <see cref="ClearStartDate"/>）</summary>
    public bool? ClearEndDate { get; set; }
    public bool? Published { get; set; }
    public int? Ordinal { get; set; }
    public int? CategoryId { get; set; }

    /// <summary>多個分類ID；沒帶（null）= 不更新分類，帶空陣列 = 清空分類。有帶就以這個為準</summary>
    public List<int>? CategoryIds { get; set; }
    public short? Type { get; set; }

    /// <summary>所屬專區；沒帶（null）= 不更新</summary>
    public short? Section { get; set; }
    public List<int>? TagIds { get; set; }

    /// <summary>換封面圖：檔案管理中的圖片檔案 Id；沒帶（null）= 不更新</summary>
    public Guid? CoverFileId { get; set; }

    /// <summary>附件：沒帶（null）= 不更新；空陣列 = 清除全部附件</summary>
    public List<Guid>? AttachmentFileIds { get; set; }

    /// <summary>專區專屬欄位：沒帶（null）= 不更新；帶了就整組取代（空物件 = 清空）</summary>
    public Dictionary<string, string>? Meta { get; set; }

    /// <summary>true = 移除封面圖（優先於 <see cref="CoverFileId"/>）</summary>
    public bool? RemoveCover { get; set; }
}
