using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Search;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 全站搜尋控制器（公開）
/// </summary>
[ApiController]
[Route("api/[controller]")]
[SwaggerTag("全站搜尋")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>
    /// 全站搜尋：同時查公告、產業案例、常見問題、影音，只回傳已發布的內容
    /// </summary>
    /// <param name="q">搜尋關鍵字（最多 100 字）</param>
    /// <param name="limit">每個類型最多回傳幾筆（1-20，預設 5）</param>
    /// <param name="cancellationToken">取消令牌</param>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _searchService.SearchAsync(q ?? string.Empty, limit, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }
}
