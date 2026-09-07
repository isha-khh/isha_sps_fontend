using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Mou;

public class UpdateMouRequest
{
    [StringLength(200, ErrorMessage = "標題長度不能超過200")]
    public string? Title { get; set; }

    public Guid? CompanyId { get; set; }
    public DateTime? SignDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public MouStatus? Status { get; set; }

    [StringLength(2000, ErrorMessage = "描述長度不能超過2000")]
    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }
}
