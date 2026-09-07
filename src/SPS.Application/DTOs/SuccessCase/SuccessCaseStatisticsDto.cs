namespace SPS.Application.DTOs.SuccessCase;

/// <summary>
/// 成功案例統計 DTO
/// </summary>
public class SuccessCaseStatisticsDto
{
    /// <summary>
    /// 總案例數量
    /// </summary>
    public int TotalCases { get; set; }

    /// <summary>
    /// 已發布案例數量
    /// </summary>
    public int PublishedCases { get; set; }

    /// <summary>
    /// 草稿案例數量
    /// </summary>
    public int DraftCases { get; set; }

    /// <summary>
    /// 總瀏覽次數
    /// </summary>
    public int TotalViews { get; set; }
}
