using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Regulations;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 法規管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("法規管理 API")]
public class RegulationsController : ControllerBase
{
    private readonly IRegulationsService _regulationsService;
    private readonly ILogger<RegulationsController> _logger;

    /// <summary>
    /// 法規控制器建構函數
    /// </summary>
    public RegulationsController(
        IRegulationsService regulationsService,
        ILogger<RegulationsController> logger)
    {
        _regulationsService = regulationsService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取法規分頁列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <returns>法規分頁列表</returns>
    /// <response code="200">成功返回法規列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] RegulationsQueryParameters parameters)
    {
        var result = await _regulationsService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據 ID 獲取法規詳情
    /// </summary>
    /// <param name="id">法規 ID</param>
    /// <returns>法規詳情</returns>
    /// <response code="200">成功返回法規詳情</response>
    /// <response code="404">法規不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _regulationsService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 根據類型獲取法規列表
    /// </summary>
    /// <param name="type">類型</param>
    /// <returns>法規列表</returns>
    /// <response code="200">成功返回法規列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet("type/{type}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByType(short type)
    {
        var result = await _regulationsService.GetByTypeAsync(type);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據分類獲取法規列表
    /// </summary>
    /// <param name="categoryId">分類 ID</param>
    /// <returns>法規列表</returns>
    /// <response code="200">成功返回法規列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet("category/{categoryId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByCategory(int categoryId)
    {
        var result = await _regulationsService.GetByCategoryAsync(categoryId);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 創建法規
    /// </summary>
    /// <param name="request">創建法規請求</param>
    /// <returns>創建的法規</returns>
    /// <response code="201">法規創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateRegulationsRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _regulationsService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新法規
    /// </summary>
    /// <param name="id">法規 ID</param>
    /// <param name="request">更新法規請求</param>
    /// <returns>更新後的法規</returns>
    /// <response code="200">法規更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">法規不存在</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRegulationsRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _regulationsService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除法規
    /// </summary>
    /// <param name="id">法規 ID</param>
    /// <returns>無內容</returns>
    /// <response code="204">法規刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">法規不存在</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _regulationsService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
