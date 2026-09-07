using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.Interfaces.IServices;

namespace SPS.Api.Controllers;

/// <summary>
/// ProTrack 整合 API（後台用，API Key 存在後端，不暴露至前端）
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ProTrackController : ControllerBase
{
    private readonly IProTrackService _proTrackService;

    public ProTrackController(IProTrackService proTrackService) => _proTrackService = proTrackService;

    /// <summary>
    /// 取得 ProTrack 表單提交清單（用於匯入選擇器）
    /// </summary>
    [HttpGet("submissions")]
    public async Task<IActionResult> GetSubmissions(CancellationToken ct)
    {
        var r = await _proTrackService.GetSubmissionsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 解析指定提交記錄，回傳預填需求表單的資料
    /// </summary>
    [HttpGet("submissions/{id}")]
    public async Task<IActionResult> ParseSubmission(string id, CancellationToken ct)
    {
        var r = await _proTrackService.ParseSubmissionAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }
}
