using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 圖片管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("圖片管理控制器")]
public class PictureController : ControllerBase
{
    private readonly IPictureService _pictureService;
    private readonly ILogger<PictureController> _logger;

    public PictureController(IPictureService pictureService, ILogger<PictureController> logger)
    {
        _pictureService = pictureService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢圖片列表
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<PictureListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] PictureQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged pictures");
        // 匿名可呼叫的公開列表：草稿（未發布）只有後台使用者（Admin 角色）看得到，其他人一律只回已發布
        if (!User.IsInRole("Admin"))
        {
            parameters.Published = true;
        }

        var result = await _pictureService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取圖片詳情
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PictureResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting picture by ID: {PictureId}", id);
        var result = await _pictureService.GetByIdAsync(id, cancellationToken);
        // 未發布的資料對非後台使用者視同不存在（404，不洩漏草稿存在與否）
        if (result.IsSuccess && result.Data is { Published: false } && !User.IsInRole("Admin"))
        {
            return NotFound(new { error = "資料不存在" });
        }

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 創建圖片
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PictureResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePictureRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating picture: {Name}", request.Name);
        var result = await _pictureService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// 更新圖片
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PictureResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePictureRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating picture: {PictureId}", id);
        var result = await _pictureService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除圖片
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting picture: {PictureId}", id);
        var result = await _pictureService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 根據相簿 ID 獲取圖片列表
    /// </summary>
    [HttpGet("album/{albumId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<PictureResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByAlbumId(int albumId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting pictures by album ID: {AlbumId}", albumId);
        var result = await _pictureService.GetByAlbumIdAsync(albumId, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
}