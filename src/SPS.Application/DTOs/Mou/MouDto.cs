using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Mou;

public class MouDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public DateTime? SignDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public MouStatus Status { get; set; }
    public string? Description { get; set; }
    public List<string>? Attachments { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
