using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Attributes;
using SPS.Application.DTOs.SiteCounter;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Domain.Enums;

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
    private readonly IMemoryCache _cache;

    /// <summary>同一個來源 IP 每分鐘最多累計幾次頁面瀏覽（正常使用者翻頁不會超過；超過的視為灌水，直接忽略）</summary>
    private const int MaxPageViewsPerIpPerMinute = 60;

    /// <summary>同一個來源 IP 在這段時間內只會被當成一次「新訪客」</summary>
    private static readonly TimeSpan NewVisitorWindow = TimeSpan.FromHours(24);

    private sealed class PageViewCounter
    {
        public int Count;
    }

    public SiteCounterController(ISiteCounterService service, IMemoryCache cache)
    {
        _service = service;
        _cache = cache;
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
        // 這支是匿名、不需要 CSRF token 的計數 API，任何人都能對著它狂打來灌首頁的「瀏覽」數字，所以：
        // - 後台使用者（有 Admin 角色）瀏覽不算
        // - 同一個 IP 每分鐘最多累計 60 次頁面瀏覽，超過的直接忽略（仍回 200，不讓灌水者知道被擋）
        // - 「新訪客」旗標由前端依 localStorage 決定、可以偽造，所以同一個 IP 24 小時內只認第一次
        if (User.IsInRole("Admin"))
        {
            return Ok((await _service.GetCounterAsync(cancellationToken)).Data);
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var counter = _cache.GetOrCreate($"site-counter-pv:{ip}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return new PageViewCounter();
        })!;
        if (Interlocked.Increment(ref counter.Count) > MaxPageViewsPerIpPerMinute)
        {
            return Ok((await _service.GetCounterAsync(cancellationToken)).Data);
        }

        if (isNewVisitor)
        {
            var key = $"site-counter-new:{ip}";
            if (_cache.TryGetValue(key, out _))
            {
                isNewVisitor = false;
            }
            else
            {
                _cache.Set(key, true, NewVisitorWindow);
            }
        }

        var result = await _service.RecordVisitAsync(isNewVisitor, cancellationToken);
        return Ok(result.Data);
    }
}

/// <summary>
/// 網站計數器管理控制器（後台）
/// </summary>
[ApiController]
[Route("api/admin/site-counter")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.ManageSiteContent)]
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
        // 計數器是累計值，不可能是負數（也避免之後前台顯示出奇怪的數字）
        if (request.TotalVisitors < 0 || request.TotalPageViews < 0)
        {
            return BadRequest(new { error = "計數必須是 0 以上的整數" });
        }

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
