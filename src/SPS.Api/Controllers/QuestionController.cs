using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Question;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 常見問題管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("常見問題管理 API")]
public class QuestionController : ControllerBase
{
    private readonly IQuestionService _questionService;
    private readonly ILogger<QuestionController> _logger;

    /// <summary>
    /// 問題控制器建構函數
    /// </summary>
    public QuestionController(
        IQuestionService questionService,
        ILogger<QuestionController> logger)
    {
        _questionService = questionService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取常見問題分頁列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <returns>常見問題分頁列表</returns>
    /// <response code="200">成功返回問題列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] QuestionQueryParameters parameters)
    {
        // 匿名可呼叫的公開列表：草稿（未發布）只有後台使用者（Admin 角色）看得到，其他人一律只回已發布
        if (!User.IsInRole("Admin"))
        {
            parameters.Published = true;
        }

        var result = await _questionService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據 ID 獲取問題詳情
    /// </summary>
    /// <param name="id">問題 ID</param>
    /// <returns>問題詳情</returns>
    /// <response code="200">成功返回問題詳情</response>
    /// <response code="404">問題不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _questionService.GetByIdAsync(id);
        // 未發布的資料對非後台使用者視同不存在（404，不洩漏草稿存在與否）
        if (result.IsSuccess && result.Data is { Published: false } && !User.IsInRole("Admin"))
        {
            return NotFound(new { error = "資料不存在" });
        }

        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 根據分類獲取問題列表
    /// </summary>
    /// <param name="categoryId">分類 ID</param>
    /// <returns>問題列表</returns>
    /// <response code="200">成功返回問題列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet("category/{categoryId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByCategory(int categoryId)
    {
        var result = await _questionService.GetByCategoryAsync(categoryId);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 創建常見問題
    /// </summary>
    /// <param name="request">創建問題請求</param>
    /// <returns>創建的問題</returns>
    /// <response code="201">問題創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateQuestionRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _questionService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新常見問題
    /// </summary>
    /// <param name="id">問題 ID</param>
    /// <param name="request">更新問題請求</param>
    /// <returns>更新後的問題</returns>
    /// <response code="200">問題更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">問題不存在</response>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _questionService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除常見問題
    /// </summary>
    /// <param name="id">問題 ID</param>
    /// <returns>無內容</returns>
    /// <response code="204">問題刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">問題不存在</response>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _questionService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
