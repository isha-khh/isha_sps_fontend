using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.File;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Api.Attributes;
using SPS.Domain.Enums;

namespace SPS.Api.Controllers;

/// <summary>
/// 彈窗公告管理控制器（後台）
/// </summary>
[ApiController]
[Route("api/admin/popup-announcements")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.ManageSiteContent)]
[Produces("application/json")]
[SwaggerTag("彈窗公告管理控制器（後台）")]
public class AdminPopupAnnouncementController : ControllerBase
{
    private readonly IPopupAnnouncementService _service;
    private readonly ILogger<AdminPopupAnnouncementController> _logger;
    private readonly IFileManagementService _fileService;

    public AdminPopupAnnouncementController(
        IPopupAnnouncementService service,
        IFileManagementService fileService,
        ILogger<AdminPopupAnnouncementController> logger)
    {
        _service = service;
        _fileService = fileService;
        _logger = logger;
    }

    /// <summary>圖片必須是檔案管理中可用的圖片（不是資料夾、已刪除的檔案、會員申請附件，也不是圖片以外的檔案）</summary>
    private async Task<string?> ValidateImageAsync(Guid? fileId, CancellationToken ct)
    {
        if (fileId == null) return null;
        var info = await _fileService.GetFileByIdAsync(fileId.Value, ct);
        if (!info.IsSuccess || info.Data == null) return "圖片必須是檔案管理中存在的圖片";
        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return "圖片必須是檔案管理中存在的圖片";
        if (await _fileService.IsApplicationDocumentFileAsync(file.Id, ct)) return "圖片必須是檔案管理中存在的圖片";
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return "圖片必須是圖片檔案";
        return null;
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
        var imageError = await ValidateImageAsync(request.CoverFileId, cancellationToken);
        if (imageError != null) return BadRequest(new { error = imageError });

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
        var imageError = await ValidateImageAsync(request.CoverFileId, cancellationToken);
        if (imageError != null) return BadRequest(new { error = imageError });

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
