using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 彈窗公告管理控制器（後台）
/// </summary>
[ApiController]
[Route("api/admin/popup-announcements")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("彈窗公告管理控制器（後台）")]
public class AdminPopupAnnouncementController : ControllerBase
{
    private readonly IPopupAnnouncementService _service;
    private readonly ILogger<AdminPopupAnnouncementController> _logger;

    public AdminPopupAnnouncementController(
        IPopupAnnouncementService service,
        ILogger<AdminPopupAnnouncementController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢彈窗公告
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PopupAnnouncementListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] PopupAnnouncementQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        var result = await _service.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 取得彈窗公告詳情
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PopupAnnouncementResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 新增彈窗公告
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PopupAnnouncementResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePopupAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// 更新彈窗公告
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PopupAnnouncementResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePopupAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除彈窗公告
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _service.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }
}
