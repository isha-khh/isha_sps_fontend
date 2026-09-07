using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 新聞管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("新聞管理控制器")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;
    private readonly ILogger<NewsController> _logger;

    /// <summary>
    /// 初始化新聞管理控制器
    /// </summary>
    /// <param name="newsService">新聞服務</param>
    /// <param name="logger">日誌記錄器</param>
    public NewsController(
        INewsService newsService,
        ILogger<NewsController> logger)
    {
        _newsService = newsService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢新聞列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞分頁列表</returns>
    /// <response code="200">成功返回新聞列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<NewsListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] NewsQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged news");

        var result = await _newsService.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取新聞詳情
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞詳細資訊</returns>
    /// <response code="200">成功返回新聞詳情</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting news by ID: {NewsId}", id);

        var result = await _newsService.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建新聞
    /// </summary>
    /// <param name="request">創建新聞請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的新聞資訊</returns>
    /// <response code="201">成功創建新聞</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateNewsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating news: {Title}", request.Title);

        var result = await _newsService.CreateAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data!.Id },
            result.Data);
    }

    /// <summary>
    /// 更新新聞
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="request">更新新聞請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的新聞資訊</returns>
    /// <response code="200">成功更新新聞</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateNewsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating news: {NewsId}", id);

        var result = await _newsService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除新聞
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">成功刪除新聞</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting news: {NewsId}", id);

        var result = await _newsService.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// 獲取新聞統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞統計數據</returns>
    /// <response code="200">成功返回統計數據</response>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting news statistics");

        var result = await _newsService.GetStatisticsAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 增加新聞瀏覽次數
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的瀏覽次數</returns>
    /// <response code="200">成功增加瀏覽次數</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpPost("{id}/view")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IncrementViewCount(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await _newsService.IncrementViewCountAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(new { viewCount = result.Data });
    }
}
