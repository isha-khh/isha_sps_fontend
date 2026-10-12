using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Chat;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台「會員檢舉」：會員檢舉會員之間的對話後，承辦人員在這裡審閱被檢舉的對話內容並處理。
/// 平常承辦人員看不到會員之間的對話，只有被檢舉的對話才能由檢舉單開啟。
/// </summary>
[ApiController]
[Route("api/admin/chat-reports")]
[Produces("application/json")]
[SwaggerTag("會員對話檢舉（後台）")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.CustomerService)]
public class ChatReportAdminController : ControllerBase
{
    private readonly IDirectChatService _direct;

    public ChatReportAdminController(IDirectChatService direct) => _direct = direct;

    private Guid? UserId => Guid.TryParse(User.FindFirst("UserId")?.Value, out var id) ? id : null;

    /// <param name="reviewed">true = 已處理、false = 未處理、不帶 = 全部</param>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] bool? reviewed, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var r = await _direct.GetReportsAsync(reviewed, page, pageSize, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var r = await _direct.GetReportDetailAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>標記已處理（或退回未處理）、寫處理備註，可同時關閉該對話</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateChatReportRequest request, CancellationToken ct)
    {
        var r = await _direct.UpdateReportAsync(id, request, UserId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error == "檢舉單不存在" ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }
}
