using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class File : BaseEntity<int>
{
    public string? Name { get; set; }
    public string? Ext { get; set; }
    public string? FileName { get; set; }
    public short Type { get; set; }
    public string? ContentType { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? NewsId { get; set; }
    public int? AboutId { get; set; }
    public string? Uri { get; set; }
    public long? DocumentId { get; set; }
    public int? ProductId { get; set; }
    public int? RegulationsId { get; set; }
    public Guid? CompanyId { get; set; }
    public int? QuestionId { get; set; }
    public long? MessagesId { get; set; }
    public string? ThumbnailUri { get; set; }
    public int? DemandId { get; set; }

    // Navigation properties
    public News? News { get; set; }
    public About? About { get; set; }
    public Document? Document { get; set; }
    public Product? Product { get; set; }
    public Regulations? Regulations { get; set; }
    public Company? Company { get; set; }
    public Question? Question { get; set; }
    public Messages? Messages { get; set; }
    public Demand? Demand { get; set; }
}
