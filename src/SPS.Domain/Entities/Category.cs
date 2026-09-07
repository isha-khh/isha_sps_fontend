using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 統一分類表 - 整合所有類型的分類
/// </summary>
public class Category : BaseEntity<int>
{
    /// <summary>
    /// 分類類型（新聞、產品、問答、法規等）
    /// </summary>
    public CategoryType Type { get; set; }

    /// <summary>
    /// 數據模式
    /// </summary>
    public DataMode DataMode { get; set; }

    /// <summary>
    /// 分類名稱（單語言）或多語言文本ID
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 多語言名稱ID（可選）
    /// </summary>
    public int? NameId { get; set; }

    /// <summary>
    /// 是否發布
    /// </summary>
    public bool Published { get; set; }

    /// <summary>
    /// 排序號
    /// </summary>
    public int Ordinal { get; set; }

    /// <summary>
    /// 父分類ID
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 是否有子分類
    /// </summary>
    public bool HasChild { get; set; }

    /// <summary>
    /// 圖片ID（單語言圖片）
    /// </summary>
    public int? PictureId { get; set; }

    /// <summary>
    /// 多語言圖片ID（可選）
    /// </summary>
    public int? MultilingualPictureId { get; set; }

    /// <summary>
    /// 備注
    /// </summary>
    public string? Remark { get; set; }

    // Navigation properties
    public Category? Parent { get; set; }
    public Picture? Picture { get; set; }
    public MultilingualText? MultilingualName { get; set; }
    public MultilingualImage? MultilingualPicture { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Attribute> Attributes { get; set; } = new List<Attribute>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<News> News { get; set; } = new List<News>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Demand> Demands { get; set; } = new List<Demand>();
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<Regulations> Regulations { get; set; } = new List<Regulations>();
}
