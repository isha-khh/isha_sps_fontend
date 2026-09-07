using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 企業管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("企業管理控制器")]
public class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<CompanyController> _logger;

    public CompanyController(
        ICompanyService companyService,
        ILogger<CompanyController> logger)
    {
        _companyService = companyService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢企業列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分頁企業列表</returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<CompanyListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] CompanyQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged companies");

        var result = await _companyService.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取企業詳情
    /// </summary>
    /// <param name="id">企業ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>企業詳情</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting company by ID: {CompanyId}", id);

        var result = await _companyService.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 根據統一編號獲取企業
    /// </summary>
    /// <param name="code">統一編號</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>企業詳情</returns>
    [HttpGet("by-code/{code}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode(
        string code,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting company by code: {Code}", code);

        var result = await _companyService.GetByUnifiedSocialCreditCodeAsync(code, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 創建企業
    /// </summary>
    /// <param name="request">創建請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的企業</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating company: {CompanyName}", request.Name);

        var result = await _companyService.CreateAsync(request, cancellationToken);

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
    /// 更新企業
    /// </summary>
    /// <param name="id">企業ID</param>
    /// <param name="request">更新請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的企業</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating company: {CompanyId}", id);

        var result = await _companyService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 取得企業目前綁定的企業標籤
    /// </summary>
    /// <param name="id">企業ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>企業標籤綁定</returns>
    [HttpGet("{id}/tags")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CompanyTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "取得企業標籤", Description = "取得指定企業目前綁定的企業標籤")]
    public async Task<IActionResult> GetTags(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _companyService.GetTagsAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 設定企業標籤（覆寫綁定，支援多個標籤）
    /// </summary>
    /// <param name="id">企業ID</param>
    /// <param name="request">標籤設定請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的企業標籤綁定</returns>
    [HttpPut("{id}/tags")]
    [Authorize]
    [ProducesResponseType(typeof(CompanyTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [SwaggerOperation(Summary = "設定企業標籤", Description = "覆寫指定企業綁定的企業標籤，可一次綁定多個標籤；傳入空集合代表清除")]
    public async Task<IActionResult> SetTags(
        Guid id,
        [FromBody] SetCompanyTagsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Setting tags for company: {CompanyId}", id);

        var result = await _companyService.SetTagsAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除企業
    /// </summary>
    /// <param name="id">企業ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting company: {CompanyId}", id);

        var result = await _companyService.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// 批次更新公司狀態
    /// </summary>
    /// <param name="request">批次更新請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批次操作結果</returns>
    [HttpPut("batch/status")]
    [Authorize]
    [ProducesResponseType(typeof(Application.DTOs.Member.BatchOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BatchUpdateStatus(
        [FromBody] Application.DTOs.Company.BatchUpdateCompanyStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CompanyIds == null || request.CompanyIds.Count == 0)
            return BadRequest(new { error = "公司 ID 列表不可為空" });

        _logger.LogInformation("Batch updating status for {Count} companies", request.CompanyIds.Count);

        var result = await _companyService.BatchUpdateStatusAsync(request, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取企業統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>企業統計數據</returns>
    /// <response code="200">成功返回統計數據</response>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting company statistics");

        var result = await _companyService.GetStatisticsAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }
}
