using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.About;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 關於我們管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("關於我們管理 API")]
public class AboutController : ControllerBase
{
    private readonly IAboutService _aboutService;
    private readonly ILogger<AboutController> _logger;

    /// <summary>
    /// 關於我們控制器建構函數
    /// </summary>
    public AboutController(
        IAboutService aboutService,
        ILogger<AboutController> logger)
    {
        _aboutService = aboutService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取關於我們分頁列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <returns>關於我們分頁列表</returns>
    /// <response code="200">成功返回列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] AboutQueryParameters parameters)
    {
        var result = await _aboutService.GetPagedAsync(parameters);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 根據 ID 獲取詳情
    /// </summary>
    /// <param name="id">ID</param>
    /// <returns>詳情</returns>
    /// <response code="200">成功返回詳情</response>
    /// <response code="404">內容不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _aboutService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.Error);
    }

    /// <summary>
    /// 根據類型獲取列表
    /// </summary>
    /// <param name="type">類型</param>
    /// <returns>列表</returns>
    /// <response code="200">成功返回列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet("type/{type}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByType(short type)
    {
        var result = await _aboutService.GetByTypeAsync(type);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 創建關於我們
    /// </summary>
    /// <param name="request">創建請求</param>
    /// <returns>創建的內容</returns>
    /// <response code="201">創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateAboutRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _aboutService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data)
            : BadRequest(result.Error);
    }

    /// <summary>
    /// 更新關於我們
    /// </summary>
    /// <param name="id">ID</param>
    /// <param name="request">更新請求</param>
    /// <returns>更新後的內容</returns>
    /// <response code="200">更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">內容不存在</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAboutRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _aboutService.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Error);
    }

    /// <summary>
    /// 刪除關於我們
    /// </summary>
    /// <param name="id">ID</param>
    /// <returns>無內容</returns>
    /// <response code="204">刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">內容不存在</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _aboutService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    /// <summary>
    /// 獲取橫幅列表
    /// </summary>
    /// <returns>橫幅列表</returns>
    /// <response code="200">成功返回橫幅列表</response>
    [HttpGet("banners")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBanners()
    {
        return await GetByType(1); // AboutType.Banner = 1
    }

    /// <summary>
    /// 獲取相關連結列表
    /// </summary>
    /// <returns>連結列表</returns>
    /// <response code="200">成功返回連結列表</response>
    [HttpGet("links")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLinks()
    {
        return await GetByType(2); // AboutType.Link = 2
    }

    /// <summary>
    /// 獲取網頁列表
    /// </summary>
    /// <returns>網頁列表</returns>
    /// <response code="200">成功返回網頁列表</response>
    [HttpGet("pages")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPages()
    {
        return await GetByType(3); // AboutType.Page = 3
    }

    /// <summary>
    /// 獲取郵件模板列表
    /// </summary>
    /// <returns>郵件模板列表</returns>
    /// <response code="200">成功返回郵件模板列表</response>
    [HttpGet("email-templates")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmailTemplates()
    {
        return await GetByType(4); // AboutType.EmailTemplate = 4
    }

    /// <summary>
    /// 獲取相簿列表
    /// </summary>
    /// <returns>相簿列表</returns>
    /// <response code="200">成功返回相簿列表</response>
    [HttpGet("albums")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlbums()
    {
        return await GetByType(5); // AboutType.Album = 5
    }
}
