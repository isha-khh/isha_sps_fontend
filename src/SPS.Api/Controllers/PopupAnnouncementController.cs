using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 彈窗公告控制器（前台）
/// </summary>
[ApiController]
[Route("api/popup-announcements")]
[Produces("application/json")]
[SwaggerTag("彈窗公告控制器（前台）")]
public class PopupAnnouncementController : ControllerBase
{
    private readonly IPopupAnnouncementService _service;
    private readonly ILogger<PopupAnnouncementController> _logger;

    public PopupAnnouncementController(
        IPopupAnnouncementService service,
        ILogger<PopupAnnouncementController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// 取得指定路由的有效彈窗公告
    /// </summary>
    /// <param name="route">路由路徑（如 /、/products）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>彈窗公告列表</returns>
    [HttpGet("active")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<PopupAnnouncementResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveByRoute(
        [FromQuery] string route = "/",
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting active popup announcements for route: {Route}", route);

        var result = await _service.GetActiveByRouteAsync(route, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }
}
