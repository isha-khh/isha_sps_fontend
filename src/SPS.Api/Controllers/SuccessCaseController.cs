using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.SuccessCase;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 成功案例管理控制器
/// 提供成功案例的查詢、創建、更新、刪除及統計功能
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("成功案例管理 API")]
public class SuccessCaseController : ControllerBase
{
    private readonly ISuccessCaseService _successCaseService;
    private readonly ILogger<SuccessCaseController> _logger;

    /// <summary>
    /// 初始化 SuccessCaseController 的新實例
    /// </summary>
    /// <param name="successCaseService">成功案例服務接口</param>
    /// <param name="logger">日誌記錄器</param>
    public SuccessCaseController(ISuccessCaseService successCaseService, ILogger<SuccessCaseController> logger)
    {
        _successCaseService = successCaseService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢成功案例列表
    /// </summary>
    /// <param name="parameters">查詢參數，包含分頁、過濾和排序條件</param>
    /// <returns>分頁後的成功案例列表</returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [SwaggerOperation(Summary = "獲取成功案例列表", Description = "根據條件分頁獲取成功案例列表")]
    public async Task<IActionResult> GetPaged([FromQuery] SuccessCaseQueryParameters parameters)
    {
        var result = await _successCaseService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據 ID 獲取特定成功案例
    /// </summary>
    /// <param name="id">成功案例 ID</param>
    /// <returns>指定 ID 的成功案例詳情</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "獲取成功案例詳情", Description = "根據 ID 獲取成功案例詳細資訊")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _successCaseService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 創建新成功案例
    /// </summary>
    /// <param name="request">創建成功案例的請求數據</param>
    /// <returns>新創建的成功案例詳情</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "創建成功案例", Description = "創建一個新的成功案例")]
    public async Task<IActionResult> Create([FromBody] CreateSuccessCaseRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _successCaseService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新現有成功案例
    /// </summary>
    /// <param name="id">要更新的成功案例 ID</param>
    /// <param name="request">更新成功案例的請求數據</param>
    /// <returns>更新後的成功案例詳情</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "更新成功案例", Description = "更新指定 ID 的成功案例資訊")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSuccessCaseRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _successCaseService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除指定成功案例
    /// </summary>
    /// <param name="id">要刪除的成功案例 ID</param>
    /// <returns>無內容</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "刪除成功案例", Description = "刪除指定 ID 的成功案例")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _successCaseService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新成功案例的發布狀態
    /// </summary>
    /// <param name="id">成功案例 ID</param>
    /// <param name="isPublished">是否發布</param>
    /// <returns>更新後的成功案例</returns>
    [HttpPatch("{id}/publish")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "更新發布狀態", Description = "更新指定成功案例的發布狀態")]
    public async Task<IActionResult> UpdatePublishStatus(int id, [FromBody] bool isPublished)
    {
        var result = await _successCaseService.UpdatePublishStatusAsync(id, isPublished);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 增加成功案例的瀏覽次數
    /// </summary>
    /// <param name="id">成功案例 ID</param>
    /// <returns>成功狀態</returns>
    [HttpPost("{id}/view")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [SwaggerOperation(Summary = "增加瀏覽次數", Description = "增加指定成功案例的瀏覽次數")]
    public async Task<IActionResult> IncrementViewCount(int id)
    {
        var result = await _successCaseService.IncrementViewCountAsync(id);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    /// <summary>
    /// 獲取成功案例統計資訊
    /// </summary>
    /// <returns>統計數據</returns>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [SwaggerOperation(Summary = "獲取統計資訊", Description = "獲取成功案例的相關統計數據")]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _successCaseService.GetStatisticsAsync();
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }
}