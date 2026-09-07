namespace SPS.Application.DTOs.Member;

/// <summary>
/// 會員統計數據 DTO
/// </summary>
public class MemberStatisticsDto
{
    /// <summary>
    /// 總會員數
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 啟用狀態會員數
    /// </summary>
    public int Active { get; set; }

    /// <summary>
    /// 停用狀態會員數
    /// </summary>
    public int Inactive { get; set; }

    /// <summary>
    /// 待審核會員數 (Status.PendingApproval)
    /// </summary>
    public int Pending { get; set; }

    /// <summary>
    /// 已批准會員數 (Status.Approved)
    /// </summary>
    public int Approved { get; set; }

    /// <summary>
    /// 已拒絕會員數 (Status.Rejected)
    /// </summary>
    public int Rejected { get; set; }

    /// <summary>
    /// 暫停會員數 (Status.Suspended)
    /// </summary>
    public int Suspended { get; set; }

    /// <summary>
    /// 鎖定會員數 (Status.Locked)
    /// </summary>
    public int Locked { get; set; }

    /// <summary>
    /// 已綁定公司的會員數
    /// </summary>
    public int WithCompany { get; set; }

    /// <summary>
    /// 未綁定公司的會員數
    /// </summary>
    public int WithoutCompany { get; set; }
}
