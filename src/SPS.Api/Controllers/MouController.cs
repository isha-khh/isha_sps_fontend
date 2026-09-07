using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Mou;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 合作備忘錄管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("合作備忘錄管理 API")]
public class MouController : ControllerBase
{
    private readonly IMouService _mouService;
    private readonly ILogger<MouController> _logger;

    public MouController(IMouService mouService, ILogger<MouController> logger)
    {
        _mouService = mouService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢合作備忘錄
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <returns>分頁結果</returns>
    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "分頁查詢合作備忘錄", Description = "取得合作備忘錄列表，支援分頁、搜尋和篩選")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] MouQueryParameters parameters)
    {
        var result = await _mouService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 取得單一合作備忘錄
    /// </summary>
    /// <param name="id">備忘錄 ID</param>
    /// <returns>備忘錄詳情</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "取得單一合作備忘錄", Description = "根據 ID 取得合作備忘錄詳細資訊")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mouService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 新增合作備忘錄
    /// </summary>
    /// <param name="request">新增請求</param>
    /// <returns>新增的備忘錄</returns>
    [HttpPost]
    [Authorize]
    [SwaggerOperation(Summary = "新增合作備忘錄", Description = "建立新的合作備忘錄")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMouRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _mouService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新合作備忘錄
    /// </summary>
    /// <param name="id">備忘錄 ID</param>
    /// <param name="request">更新請求</param>
    /// <returns>更新後的備忘錄</returns>
    [HttpPut("{id}")]
    [Authorize]
    [SwaggerOperation(Summary = "更新合作備忘錄", Description = "更新指定的合作備忘錄")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMouRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _mouService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除合作備忘錄
    /// </summary>
    /// <param name="id">備忘錄 ID</param>
    /// <returns>無內容</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [SwaggerOperation(Summary = "刪除合作備忘錄", Description = "刪除指定的合作備忘錄")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mouService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新合作備忘錄狀態
    /// </summary>
    /// <param name="id">備忘錄 ID</param>
    /// <param name="status">新狀態</param>
    /// <returns>更新後的備忘錄</returns>
    [HttpPatch("{id}/status")]
    [Authorize]
    [SwaggerOperation(Summary = "更新合作備忘錄狀態", Description = "更新指定備忘錄的狀態（如：生效中、已到期等）")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] MouStatus status)
    {
        var result = await _mouService.UpdateStatusAsync(id, status);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 取得合作備忘錄統計
    /// </summary>
    /// <returns>統計資訊</returns>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "取得合作備忘錄統計", Description = "取得合作備忘錄的統計資訊（數量、狀態分佈等）")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _mouService.GetStatisticsAsync();
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }
}
