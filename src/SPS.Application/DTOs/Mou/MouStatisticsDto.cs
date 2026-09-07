namespace SPS.Application.DTOs.Mou;

/// <summary>
/// MOU 統計數據 DTO
/// </summary>
public class MouStatisticsDto
{
    /// <summary>
    /// 總 MOU 數量
    /// </summary>
    public int TotalMous { get; set; }

    /// <summary>
    /// 生效中的 MOU 數量
    /// </summary>
    public int ActiveMous { get; set; }

    /// <summary>
    /// 已過期的 MOU 數量
    /// </summary>
    public int ExpiredMous { get; set; }

    /// <summary>
    /// 草稿狀態的 MOU 數量
    /// </summary>
    public int DraftMous { get; set; }
}
