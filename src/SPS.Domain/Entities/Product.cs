using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Product : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
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
    public int? DescriptionId { get; set; }
    public string? Remark { get; set; }
    public int? CoverId { get; set; }
    public int? BaseId { get; set; }
    public int? CategoryId { get; set; }
    public Guid? CompanyId { get; set; }
    public bool Published { get; set; }

    // Navigation properties
    public StringResource? Description { get; set; }
    public Picture? Cover { get; set; }
    public Product? Base { get; set; }
    public Category? Category { get; set; }
    public Company? Company { get; set; }
    public ICollection<Product> Variants { get; set; } = new List<Product>();
    public ICollection<Picture> Pictures { get; set; } = new List<Picture>();
    public ICollection<File> Files { get; set; } = new List<File>();
    public ICollection<UploadedFile> UploadedFiles { get; set; } = new List<UploadedFile>();
}
