using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Banner;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// Banner 管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("Banner 管理控制器")]
public class BannerController : ControllerBase
{
    private readonly IBannerService _bannerService;
    private readonly ILogger<BannerController> _logger;

    /// <summary>
    /// 初始化 Banner 管理控制器
    /// </summary>
    /// <param name="bannerService">Banner 服務</param>
    /// <param name="logger">日誌記錄器</param>
    public BannerController(
        IBannerService bannerService,
        ILogger<BannerController> logger)
    {
        _bannerService = bannerService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢 Banner 列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>Banner 分頁列表</returns>
    /// <response code="200">成功返回 Banner 列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<BannerListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] BannerQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged banners");

        var result = await _bannerService.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取 Banner 詳情
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>Banner 詳細資訊</returns>
    /// <response code="200">成功返回 Banner 詳情</response>
    /// <response code="404">找不到指定的 Banner</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BannerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting banner by ID: {BannerId}", id);

        var result = await _bannerService.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建 Banner
    /// </summary>
    /// <param name="request">創建 Banner 請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的 Banner 資訊</returns>
    /// <response code="201">成功創建 Banner</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BannerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateBannerRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating banner: {Name}", request.Name);

        var result = await _bannerService.CreateAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data!.Id },
            result.Data);
    }

    /// <summary>
    /// 更新 Banner
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="request">更新 Banner 請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的 Banner 資訊</returns>
    /// <response code="200">成功更新 Banner</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的 Banner</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(BannerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] UpdateBannerRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating banner: {BannerId}", id);

        var result = await _bannerService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除 Banner
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">成功刪除 Banner</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的 Banner</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        long id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting banner: {BannerId}", id);

        var result = await _bannerService.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// 根據位置 ID 獲取 Banner 列表
    /// </summary>
    /// <param name="positionId">位置 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>Banner 列表</returns>
    /// <response code="200">成功返回 Banner 列表</response>
    [HttpGet("position/{positionId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BannerResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPositionId(
        int positionId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting banners by position ID: {PositionId}", positionId);

        var result = await _bannerService.GetByPositionIdAsync(positionId, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 增加 Banner 檢視次數
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    /// <response code="200">成功增加檢視次數</response>
    /// <response code="404">找不到指定的 Banner</response>
    [HttpPost("{id}/view")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IncrementViewCount(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _bannerService.IncrementViewCountAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(new { message = "檢視次數已增加" });
    }

    /// <summary>
    /// 增加 Banner 點擊次數
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>成功訊息</returns>
    /// <response code="200">成功增加點擊次數</response>
    /// <response code="404">找不到指定的 Banner</response>
    [HttpPost("{id}/click")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IncrementClickCount(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _bannerService.IncrementClickCountAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(new { message = "點擊次數已增加" });
    }
}