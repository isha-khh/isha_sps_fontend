using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Product;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 產品管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("產品管理 API")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    /// <summary>
    /// 產品控制器建構函數
    /// </summary>
    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// 獲取產品分頁列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>產品分頁列表</returns>
    /// <response code="200">成功返回產品列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] ProductQueryParameters parameters, CancellationToken ct)
    {
        var result = await _productService.GetPagedAsync(parameters, ct);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 根據 ID 獲取產品詳情
    /// </summary>
    /// <param name="id">產品 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>產品詳情</returns>
    /// <response code="200">成功返回產品詳情</response>
    /// <response code="404">產品不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await _productService.GetByIdAsync(id, ct);
        return result.IsSuccess ? Ok(result.Data) : NotFound(new { error = result.Error });
    }

    /// <summary>
    /// 創建新產品
    /// </summary>
    /// <param name="request">創建產品請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>創建的產品</returns>
    /// <response code="201">產品創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var result = await _productService.CreateAsync(request, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新產品
    /// </summary>
    /// <param name="id">產品 ID</param>
    /// <param name="request">更新產品請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新後的產品</returns>
    /// <response code="200">產品更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">產品不存在</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request, CancellationToken ct)
    {
        var result = await _productService.UpdateAsync(id, request, ct);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 刪除產品
    /// </summary>
    /// <param name="id">產品 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">產品刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">產品不存在</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var result = await _productService.DeleteAsync(id, ct);
        return result.IsSuccess ? NoContent() : NotFound(new { error = result.Error });
    }
}
