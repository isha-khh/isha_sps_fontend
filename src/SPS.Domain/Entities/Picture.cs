using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Picture : BaseEntity<int>
{
    public string? Name { get; set; }
    public string? Culture { get; set; }
    public short Type { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public string? LinkUrl { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Ordinal { get; set; }
    public int Height { get; set; }
    public int Width { get; set; }
    public int Dpi { get; set; }
    public string? Remark { get; set; }
    public int? AlbumId { get; set; }
    public int? ProductId { get; set; }
    public int? MultilingualImageId { get; set; }

    // Navigation properties
    public Album? Album { get; set; }
    public Product? Product { get; set; }
    public MultilingualImage? MultilingualImage { get; set; }
    public ICollection<Company> CompaniesWithPhoto { get; set; } = new List<Company>();
    public ICollection<Company> CompaniesWithBanner { get; set; } = new List<Company>();
    public ICollection<Person> Persons { get; set; } = new List<Person>();
    public ICollection<Member> Members { get; set; } = new List<Member>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
