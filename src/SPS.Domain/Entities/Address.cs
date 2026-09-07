using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Address : BaseEntity<int>
{
    public short Type { get; set; }
    public string? PostalCode { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Line { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<Company> Companies { get; set; } = new List<Company>();
    public ICollection<Person> Persons { get; set; } = new List<Person>();
}
