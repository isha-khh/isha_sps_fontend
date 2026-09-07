using SPS.Application.DTOs.Picture;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Product;

public class ProductResponse
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ModelNo { get; set; }
    public bool Mixed { get; set; }
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
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public bool Published { get; set; }

    /// <summary>
    /// 封面圖片
    /// </summary>
    public PictureResponse? Cover { get; set; }

    /// <summary>
    /// 產品圖片列表
    /// </summary>
    public List<PictureResponse> Pictures { get; set; } = new();

    /// <summary>
    /// 產品圖片數量
    /// </summary>
    public int PictureCount { get; set; }

    /// <summary>
    /// 產品文件列表
    /// </summary>
    public List<ProductFileResponse> Files { get; set; } = new();

    /// <summary>
    /// 產品文件數量
    /// </summary>
    public int FileCount { get; set; }

    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}

/// <summary>
/// 產品文件響應（對應 UploadedFile）
/// </summary>
public class ProductFileResponse
{
    public Guid Id { get; set; }
    public string FileNumber { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FormattedFileSize { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public DateTime CreatedTime { get; set; }
}
