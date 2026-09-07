using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 領取申請請求（審核員）
/// </summary>
public class ClaimApplicationRequest
{
    /// <summary>
    /// 申請ID
    /// </summary>
    [Required(ErrorMessage = "申請ID不能為空")]
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 審核人ID
    /// </summary>
    [Required(ErrorMessage = "審核人ID不能為空")]
    public Guid ReviewerId { get; set; }
}
