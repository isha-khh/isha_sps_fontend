using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 審核申請請求
/// </summary>
public class ReviewApplicationRequest
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

    /// <summary>
    /// 是否通過
    /// </summary>
    [Required(ErrorMessage = "審核結果不能為空")]
    public bool IsApproved { get; set; }

    /// <summary>
    /// 審核意見
    /// </summary>
    public string? ReviewComment { get; set; }

    /// <summary>
    /// 拒絕原因（拒絕時必填）
    /// </summary>
    public string? RejectionReason { get; set; }
}
