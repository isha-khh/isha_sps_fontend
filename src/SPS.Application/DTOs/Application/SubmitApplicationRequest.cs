namespace SPS.Application.DTOs.Application;

/// <summary>
/// 提交申請請求
/// </summary>
public class SubmitApplicationRequest
{
    /// <summary>
    /// 申請ID
    /// </summary>
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 備注
    /// </summary>
    public string? Remark { get; set; }
}
