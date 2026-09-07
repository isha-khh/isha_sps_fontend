using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Person : BaseEntity<Guid>
{
    public DataMode DataMode { get; set; }
    public string? Name { get; set; }
    public string? Nickname { get; set; }
    public int? PhotoId { get; set; }
    public Sex Sex { get; set; }
    public string? PersonalId { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? MobilePhone { get; set; }
    public string? Email { get; set; }
    public int? AddressId { get; set; }
    public string? Remark { get; set; }

    // Navigation properties
    public Picture? Photo { get; set; }
    public Address? Address { get; set; }
    public Member? Member { get; set; }
    public User? User { get; set; }
}
