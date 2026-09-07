using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.SiteCounter;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 網站計數器控制器
/// </summary>
[ApiController]
[Route("api/site-counter")]
[Produces("application/json")]
[SwaggerTag("網站計數器")]
public class SiteCounterController : ControllerBase
{
    private readonly ISiteCounterService _service;

    public SiteCounterController(ISiteCounterService service)
    {
        _service = service;
    }

    /// <summary>
    /// 取得網站計數
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SiteCounterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCounter(CancellationToken cancellationToken)
    {
        var result = await _service.GetCounterAsync(cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 記錄訪問（前台呼叫）
    /// </summary>
    /// <param name="isNewVisitor">是否為新訪客（由前端判斷 localStorage）</param>
    /// <param name="cancellationToken"></param>
    [HttpPost("visit")]
    [AllowAnonymous]
    [ActionLog(IsEnabled = false)]
    [ProducesResponseType(typeof(SiteCounterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordVisit(
        [FromQuery] bool isNewVisitor = false,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.RecordVisitAsync(isNewVisitor, cancellationToken);
        return Ok(result.Data);
    }
}

/// <summary>
/// 網站計數器管理控制器（後台）
/// </summary>
[ApiController]
[Route("api/admin/site-counter")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("網站計數器管理")]
public class AdminSiteCounterController : ControllerBase
{
    private readonly ISiteCounterService _service;

    public AdminSiteCounterController(ISiteCounterService service)
    {
        _service = service;
    }

    /// <summary>
    /// 取得網站計數
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteCounterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCounter(CancellationToken cancellationToken)
    {
        var result = await _service.GetCounterAsync(cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 設定網站計數
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(SiteCounterResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetCounter(
        [FromBody] SetSiteCounterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.SetCounterAsync(request.TotalVisitors, request.TotalPageViews, cancellationToken);
        return Ok(result.Data);
    }
}

/// <summary>
/// 設定網站計數請求
/// </summary>
public class SetSiteCounterRequest
{
    public long? TotalVisitors { get; set; }
    public long? TotalPageViews { get; set; }
}
