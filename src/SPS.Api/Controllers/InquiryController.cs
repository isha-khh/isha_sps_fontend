using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Inquiry;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 詢問單：前台各個「留下資料等人回覆」的表單（提案、訂閱解方、下載申請、索取補助資料、訂閱電子報）送到這裡，
/// 後台「詢問單」收件匣檢視與標記處理進度。
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("詢問單 API")]
public class InquiryController : ControllerBase
{
    private const int AnonymousPerHour = 10;
    private const int MemberPerHour = 30;

    private readonly IInquiryService _inquiryService;
    private readonly IMemoryCache _cache;

    public InquiryController(IInquiryService inquiryService, IMemoryCache cache)
    {
        _inquiryService = inquiryService;
        _cache = cache;
    }

    /// <summary>
    /// 前台送出詢問單。訂閱解方要登入會員、提案要企業會員，其他種類匿名也可以（要同意個資告知）；
    /// 有登入就記錄是誰送的。同一個 IP／會員每小時有送出次數上限。
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create([FromBody] CreateInquiryRequest request, CancellationToken ct)
    {
        Guid? memberId = Guid.TryParse(User.FindFirst("MemberId")?.Value, out var parsed) ? parsed : null;
        var isEnterprise = memberId != null && (User.IsInRole("Supplier") || User.IsInRole("Buyer"));
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var key = memberId != null ? $"inquiry:m:{memberId}" : $"inquiry:ip:{ip}";
        var limit = memberId != null ? MemberPerHour : AnonymousPerHour;
        var counter = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref counter[0]) > limit)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "送出次數過多，請稍後再試" });
        }

        var r = await _inquiryService.CreateAsync(request, memberId, isEnterprise, ip, ct);
        return r.IsSuccess ? Ok(new { success = true }) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：詢問單列表</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetPaged([FromQuery] InquiryQueryParameters parameters, CancellationToken ct)
    {
        var r = await _inquiryService.GetPagedAsync(parameters, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：各處理狀態的數量（收件匣上方的統計）</summary>
    [HttpGet("counts")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetCounts(CancellationToken ct)
    {
        var r = await _inquiryService.GetCountsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：詢問單詳情</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var r = await _inquiryService.GetByIdAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>後台：更新處理狀態與備註</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInquiryRequest request, CancellationToken ct)
    {
        Guid? userId = Guid.TryParse(User.FindFirst("UserId")?.Value, out var parsed) ? parsed : null;
        var r = await _inquiryService.UpdateAsync(id, request, userId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error?.Contains("不存在") == true ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：刪除詢問單</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var r = await _inquiryService.DeleteAsync(id, ct);
        return r.IsSuccess ? NoContent() : NotFound(new { error = r.Error });
    }
}
