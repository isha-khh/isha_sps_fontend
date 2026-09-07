using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Tag;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 標籤管理控制器
/// 提供標籤的查詢、創建、更新和刪除功能
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("標籤管理控制器")]
public class TagController : ControllerBase
{
    private readonly ITagService _tagService;
    private readonly ILogger<TagController> _logger;

    /// <summary>
    /// 初始化 TagController 的新實例
    /// </summary>
    /// <param name="tagService">標籤服務接口</param>
    /// <param name="logger">日誌記錄器</param>
    public TagController(ITagService tagService, ILogger<TagController> logger)
    {
        _tagService = tagService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢標籤列表
    /// </summary>
    /// <param name="parameters">查詢參數，包含分頁和過濾條件</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分頁後的標籤列表</returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<TagResponse>), StatusCodes.Status200OK)]
    [SwaggerOperation(Summary = "獲取標籤列表", Description = "根據條件分頁獲取標籤列表")]
    public async Task<IActionResult> GetPaged([FromQuery] TagQueryParameters parameters, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged tags");
        var result = await _tagService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 根據 ID 獲取特定標籤
    /// </summary>
    /// <param name="id">標籤 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>指定 ID 的標籤詳情</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "獲取標籤詳情", Description = "根據 ID 獲取標籤詳細資訊")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting tag by ID: {TagId}", id);
        var result = await _tagService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 創建新標籤
    /// </summary>
    /// <param name="request">創建標籤的請求數據</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新創建的標籤詳情</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "創建標籤", Description = "創建一個新的標籤")]
    public async Task<IActionResult> Create([FromBody] CreateTagRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating tag: {Name}", request.Name);
        var result = await _tagService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// 更新現有標籤
    /// </summary>
    /// <param name="id">要更新的標籤 ID</param>
    /// <param name="request">更新標籤的請求數據</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的標籤詳情</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "更新標籤", Description = "更新指定 ID 的標籤資訊")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTagRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating tag: {TagId}", id);
        var result = await _tagService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除指定標籤
    /// </summary>
    /// <param name="id">要刪除的標籤 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "刪除標籤", Description = "刪除指定 ID 的標籤")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting tag: {TagId}", id);
        var result = await _tagService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }
        return NoContent();
    }
}