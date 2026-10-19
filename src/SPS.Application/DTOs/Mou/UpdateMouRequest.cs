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

    /// <summary>true＝清除簽約日期／開始日期／結束日期（日期沒帶代表「不更新」，所以要清掉得另外說明）</summary>
    public bool? ClearSignDate { get; set; }
    public bool? ClearStartDate { get; set; }
    public bool? ClearEndDate { get; set; }
    public MouStatus? Status { get; set; }

    [StringLength(2000, ErrorMessage = "描述長度不能超過2000")]
    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }
}
