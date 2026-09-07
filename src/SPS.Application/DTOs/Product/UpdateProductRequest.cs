using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Product;

/// <summary>
/// 更新產品請求
/// </summary>
public class UpdateProductRequest
{
    public string? Name { get; set; }
    public string? ModelNo { get; set; }
    public bool? Mixed { get; set; }
    public string? Unit { get; set; }
    public LengthUnit? LengthUnit { get; set; }
    public float? Height { get; set; }
    public float? Width { get; set; }
    public float? Depth { get; set; }
    public WeightUnit? WeightUnit { get; set; }
    public double? NetWeight { get; set; }
    public double? GrossWeight { get; set; }
    public double? ConditionedWeight { get; set; }
    public string? Introduction { get; set; }
    public string? Remark { get; set; }
    public int? CategoryId { get; set; }
    public bool? Published { get; set; }

    /// <summary>
    /// 封面圖片 ID
    /// </summary>
    public int? CoverId { get; set; }

    /// <summary>
    /// 是否移除封面圖片
    /// </summary>
    public bool RemoveCover { get; set; } = false;

    /// <summary>
    /// 產品圖片 ID 列表（會取代現有圖片）
    /// </summary>
    public List<int>? PictureIds { get; set; }

    /// <summary>
    /// 產品文件 ID 列表（會取代現有文件，使用 UploadedFile Guid）
    /// </summary>
    public List<Guid>? FileIds { get; set; }
}
