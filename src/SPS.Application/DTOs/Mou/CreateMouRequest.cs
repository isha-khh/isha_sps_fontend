using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Mou;

public class CreateMouRequest
{
    [Required(ErrorMessage = "標題不能為空")]
    [StringLength(200, ErrorMessage = "標題長度不能超過200")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "公司 ID 不能為空")]
    public Guid CompanyId { get; set; }

    public DateTime? SignDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
    public MouStatus Status { get; set; } = MouStatus.Draft;

    [StringLength(2000, ErrorMessage = "描述長度不能超過2000")]
    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }
}
