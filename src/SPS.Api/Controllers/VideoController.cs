using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Video;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 影片管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("影片管理控制器")]
public class VideoController : ControllerBase
{
    private readonly IVideoService _videoService;
    private readonly ILogger<VideoController> _logger;

    public VideoController(IVideoService videoService, ILogger<VideoController> logger)
    {
        _videoService = videoService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢影片列表
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<VideoListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] VideoQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged videos");
        var result = await _videoService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取影片詳情
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VideoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting video by ID: {VideoId}", id);
        var result = await _videoService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 創建影片
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(VideoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateVideoRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating video: {Name}", request.Name);
        var result = await _videoService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// 更新影片
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(VideoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateVideoRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating video: {VideoId}", id);
        var result = await _videoService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除影片
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting video: {VideoId}", id);
        var result = await _videoService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 根據相簿 ID 獲取影片列表
    /// </summary>
    [HttpGet("album/{albumId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<VideoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByAlbumId(int albumId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting videos by album ID: {AlbumId}", albumId);
        var result = await _videoService.GetByAlbumIdAsync(albumId, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
}