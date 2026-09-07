using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Product;

/// <summary>
/// 創建產品請求
/// </summary>
public class CreateProductRequest
{
    /// <summary>
    /// 產品名稱
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 型號
    /// </summary>
    public string? ModelNo { get; set; }

    /// <summary>
    /// 是否混合產品
    /// </summary>
    public bool Mixed { get; set; }

    /// <summary>
    /// 單位
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// 長度單位
    /// </summary>
    public LengthUnit? LengthUnit { get; set; }

    /// <summary>
    /// 高度
    /// </summary>
    public float? Height { get; set; }

    /// <summary>
    /// 寬度
    /// </summary>
    public float? Width { get; set; }

    /// <summary>
    /// 深度
    /// </summary>
    public float? Depth { get; set; }

    /// <summary>
    /// 重量單位
    /// </summary>
    public WeightUnit? WeightUnit { get; set; }

    /// <summary>
    /// 淨重
    /// </summary>
    public double? NetWeight { get; set; }

    /// <summary>
    /// 毛重
    /// </summary>
    public double? GrossWeight { get; set; }

    /// <summary>
    /// 調整重量
    /// </summary>
    public double? ConditionedWeight { get; set; }

    /// <summary>
    /// 簡介
    /// </summary>
    public string? Introduction { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 類別ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 企業ID
    /// </summary>
    public Guid? CompanyId { get; set; }

    /// <summary>
    /// 是否發布
    /// </summary>
    public bool Published { get; set; }

    /// <summary>
    /// 封面圖片 ID
    /// </summary>
    public int? CoverId { get; set; }

    /// <summary>
    /// 產品圖片 ID 列表
    /// </summary>
    public List<int>? PictureIds { get; set; }

    /// <summary>
    /// 產品文件 ID 列表（使用 UploadedFile Guid）
    /// </summary>
    public List<Guid>? FileIds { get; set; }
}
