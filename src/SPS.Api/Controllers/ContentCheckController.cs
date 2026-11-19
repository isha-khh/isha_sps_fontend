using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台「內容檢查」：逐篇檢查所有已發布的文章（公告、常見問題、產業案例、法規），有問題的依選項轉成草稿。
/// 背景執行，進度經 <c>/hubs/admin</c> 即時推給後台鈴鐺；規則見 <c>ArticleContentRules</c>。
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("內容檢查 API")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.ManageSettings)]
public class ContentCheckController : ControllerBase
{
    private readonly IArticleCheckJobService _jobs;

    public ContentCheckController(IArticleCheckJobService jobs) => _jobs = jobs;

    public sealed class StartContentCheckRequest
    {
        /// <summary>true＝有問題的文章轉成草稿並寫下原因；false＝預覽，只檢查不動文章</summary>
        public bool ApplyDraft { get; set; }
    }

    [HttpPost("start")]
    [SwaggerOperation(Summary = "開始內容檢查（背景執行）。已有任務進行中時回傳那一個（alreadyActive=true）")]
    public async Task<IActionResult> Start([FromBody] StartContentCheckRequest request, CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var name = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? userId;
        var result = await _jobs.EnqueueAsync(request.ApplyDraft, name, userId, ct);
        return result.AlreadyActive ? Ok(result) : Accepted(result);
    }

    [HttpGet("status")]
    [SwaggerOperation(Summary = "最近一個內容檢查任務的狀態（進行中或剛結束的）；從來沒跑過回傳 job=null")]
    public IActionResult Status() => Ok(new { job = _jobs.GetLatest() });

    [HttpPost("{id:guid}/cancel")]
    [SwaggerOperation(Summary = "取消進行中的內容檢查（已轉成草稿的文章不會還原）")]
    public IActionResult Cancel(Guid id) => _jobs.Cancel(id) ? Ok(new { cancelled = true }) : NotFound(new { error = "沒有可取消的任務" });
}
