using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Attribute;

/// <summary>
/// 更新屬性請求 DTO
/// </summary>
public class UpdateAttributeRequest
{
    /// <summary>
    /// 分類 ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 屬性代碼
    /// </summary>
    [StringLength(50, ErrorMessage = "屬性代碼長度不能超過50")]
    public string? Code { get; set; }

    /// <summary>
    /// 屬性名稱
    /// </summary>
    [StringLength(100, ErrorMessage = "屬性名稱長度不能超過100")]
    public string? Name { get; set; }

    /// <summary>
    /// 屬性描述
    /// </summary>
    [StringLength(500, ErrorMessage = "屬性描述長度不能超過500")]
    public string? Description { get; set; }

    /// <summary>
    /// 是否可選擇
    /// </summary>
    public bool? Selectable { get; set; }

    /// <summary>
    /// 是否支持多選
    /// </summary>
    public bool? Multiple { get; set; }

    /// <summary>
    /// 是否必填
    /// </summary>
    public bool? Required { get; set; }

    /// <summary>
    /// 排序順序
    /// </summary>
    public int? Ordinal { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    [StringLength(500, ErrorMessage = "備註長度不能超過500")]
    public string? Remark { get; set; }

    /// <summary>
    /// 屬性類型（業務/產品）
    /// </summary>
    public AttributeType? Type { get; set; }
}
