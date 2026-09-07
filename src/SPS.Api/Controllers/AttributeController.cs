using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Attribute;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 屬性管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("屬性管理 API")]
public class AttributeController : ControllerBase
{
    private readonly IAttributeService _attributeService;
    private readonly ILogger<AttributeController> _logger;

    public AttributeController(
        IAttributeService attributeService,
        ILogger<AttributeController> logger)
    {
        _attributeService = attributeService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取屬性分頁列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <returns>屬性分頁列表</returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] AttributeQueryParameters parameters)
    {
        var result = await _attributeService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據 ID 獲取屬性詳情
    /// </summary>
    /// <param name="id">屬性 ID</param>
    /// <returns>屬性詳情</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _attributeService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 根據類型獲取屬性列表
    /// </summary>
    /// <param name="type">屬性類型</param>
    /// <returns>屬性列表</returns>
    [HttpGet("type/{type}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByType(AttributeType type)
    {
        var result = await _attributeService.GetByTypeAsync(type);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 創建屬性
    /// </summary>
    /// <param name="request">創建屬性請求</param>
    /// <returns>創建的屬性</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateAttributeRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _attributeService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新屬性
    /// </summary>
    /// <param name="id">屬性 ID</param>
    /// <param name="request">更新屬性請求</param>
    /// <returns>更新後的屬性</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAttributeRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _attributeService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除屬性
    /// </summary>
    /// <param name="id">屬性 ID</param>
    /// <returns>無內容</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _attributeService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
