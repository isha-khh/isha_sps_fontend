using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class BannerPosition : BaseEntity<int>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DataMode DataMode { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public decimal? ViewUnitPrice { get; set; }
    public decimal? ClickUnitPrice { get; set; }
    public decimal? TimeSpanUnitPrice { get; set; }
    public string? Remark { get; set; }

    // Navigation properties
    public ICollection<Banner> Banners { get; set; } = new List<Banner>();
}
