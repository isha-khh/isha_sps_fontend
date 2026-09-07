using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 網站數據分析控制器
/// </summary>
[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "SuperAdmin,AnalyticsViewer")]
[Produces("application/json")]
[SwaggerTag("網站數據分析控制器")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取日期範圍內的完整數據報告
    /// </summary>
    /// <param name="startDate">開始日期 (預設前30天)</param>
    /// <param name="endDate">結束日期 (預設昨天)</param>
    /// <returns>包含每日趨勢與各項分佈的報告</returns>
    [HttpGet]
    [SwaggerOperation(Summary = "獲取網站分析報告", Description = "獲取指定日期範圍內的流量趨勢與裝置/國家/語言分佈")]
    public async Task<IActionResult> GetReport([FromQuery] DateOnly? startDate, [FromQuery] DateOnly? endDate)
    {
        // 預設查詢過去 30 天
        var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var start = startDate ?? end.AddDays(-29);

        var result = await _analyticsService.GetAnalyticsReportAsync(start, end);

        if (result.IsSuccess)
        {
            return Ok(result.Data);
        }

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 手動觸發數據同步
    /// </summary>
    /// <param name="days">同步天數 (預設 1 天，即昨天)</param>
    /// <returns>同步結果</returns>
    [HttpPost("sync")]
    [SwaggerOperation(Summary = "同步 Google Analytics 數據", Description = "從 Google Analytics 手動同步數據到資料庫")]
    public async Task<IActionResult> Sync([FromQuery] int days = 1)
    {
        var result = await _analyticsService.SyncAnalyticsDataAsync(days);

        if (result.IsSuccess)
        {
            return Ok(new { message = "Synchronization successful" });
        }

        return BadRequest(new { error = result.Error });
    }
}
