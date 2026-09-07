using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.SiteStatistics;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 網站統計數據控制器（前台）
/// </summary>
[ApiController]
[Route("api/site-statistics")]
[Produces("application/json")]
[SwaggerTag("網站統計數據")]
public class SiteStatisticsController : ControllerBase
{
    private readonly ISiteStatisticsService _service;

    public SiteStatisticsController(ISiteStatisticsService service)
    {
        _service = service;
    }

    /// <summary>
    /// 取得網站統計數據
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SiteStatisticsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _service.GetStatisticsAsync(cancellationToken);
        return Ok(result.Data);
    }
}

/// <summary>
/// 網站統計數據管理控制器（後台）
/// </summary>
[ApiController]
[Route("api/admin/site-statistics")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("網站統計數據管理")]
public class AdminSiteStatisticsController : ControllerBase
{
    private readonly ISiteStatisticsService _service;

    public AdminSiteStatisticsController(ISiteStatisticsService service)
    {
        _service = service;
    }

    /// <summary>
    /// 取得網站統計數據
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteStatisticsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _service.GetStatisticsAsync(cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 設定網站統計數據
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(SiteStatisticsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetStatistics(
        [FromBody] SetSiteStatisticsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.SetStatisticsAsync(
            request.SuccessfulMatches,
            request.SubsidyApplications,
            cancellationToken);
        return Ok(result.Data);
    }
}
