using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Album;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 相簿管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("相簿管理控制器")]
public class AlbumController : ControllerBase
{
    private readonly IAlbumService _albumService;
    private readonly ILogger<AlbumController> _logger;

    /// <summary>
    /// 初始化相簿管理控制器
    /// </summary>
    /// <param name="albumService">相簿服務</param>
    /// <param name="logger">日誌記錄器</param>
    public AlbumController(
        IAlbumService albumService,
        ILogger<AlbumController> logger)
    {
        _albumService = albumService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢相簿列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>相簿分頁列表</returns>
    /// <response code="200">成功返回相簿列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<AlbumListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] AlbumQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged albums");

        var result = await _albumService.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取相簿詳情
    /// </summary>
    /// <param name="id">相簿 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>相簿詳細資訊</returns>
    /// <response code="200">成功返回相簿詳情</response>
    /// <response code="404">找不到指定的相簿</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AlbumResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting album by ID: {AlbumId}", id);

        var result = await _albumService.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建相簿
    /// </summary>
    /// <param name="request">創建相簿請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的相簿資訊</returns>
    /// <response code="201">成功創建相簿</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(AlbumResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAlbumRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating album: {Title}", request.Title);

        var result = await _albumService.CreateAsync(request, cancellationToken);

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
    /// 更新相簿
    /// </summary>
    /// <param name="id">相簿 ID</param>
    /// <param name="request">更新相簿請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的相簿資訊</returns>
    /// <response code="200">成功更新相簿</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的相簿</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(AlbumResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateAlbumRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating album: {AlbumId}", id);

        var result = await _albumService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除相簿
    /// </summary>
    /// <param name="id">相簿 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">成功刪除相簿</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的相簿</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting album: {AlbumId}", id);

        var result = await _albumService.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }
}