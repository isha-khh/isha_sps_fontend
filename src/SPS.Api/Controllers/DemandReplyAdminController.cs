using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Demand;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台「需求回應」審核：供應業者對媒合對接需求送出的回應，通過後才寄給刊登者與追蹤者。
/// </summary>
[ApiController]
[Route("api/admin/demand-replies")]
[Produces("application/json")]
[SwaggerTag("需求回應審核（後台）")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.CustomerService)]
public class DemandReplyAdminController : ControllerBase
{
    private readonly IDemandReplyService _replies;

    public DemandReplyAdminController(IDemandReplyService replies) => _replies = replies;

    private Guid? UserId => Guid.TryParse(User.FindFirst("UserId")?.Value, out var id) ? id : null;

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] DemandReplyQueryParameters p, CancellationToken ct)
    {
        var r = await _replies.GetPagedAsync(p, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    [HttpGet("counts")]
    public async Task<IActionResult> GetCounts(CancellationToken ct)
    {
        var r = await _replies.GetCountsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>通過：之後會在背景寄信給刊登者與當下所有追蹤者</summary>
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var r = await _replies.ApproveAsync(id, UserId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error == "回應不存在" ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }

    /// <summary>退回：要填原因，會寄信通知供應業者</summary>
    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectDemandReplyRequest request, CancellationToken ct)
    {
        var r = await _replies.RejectAsync(id, request.Reason, UserId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error == "回應不存在" ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }
}
