using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 管理員公司管理控制器
/// </summary>
[ApiController]
[Route("api/admin/company")]
[Authorize(Roles = "SuperAdmin")]
[SwaggerTag("管理員公司管理控制器")]
public class AdminCompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<AdminCompanyController> _logger;

    public AdminCompanyController(
        ICompanyService companyService,
        ILogger<AdminCompanyController> logger)
    {
        _companyService = companyService;
        _logger = logger;
    }

    /// <summary>
    /// 刪除公司所有資料（包含圖片、產品、需求、成員等所有關聯資料）
    /// </summary>
    /// <param name="id">公司 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    /// <response code="200">成功刪除公司所有資料</response>
    /// <response code="400">刪除失敗</response>
    /// <response code="401">未授權</response>
    /// <response code="403">權限不足</response>
    [HttpDelete("{id}/all-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAllCompanyData(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogWarning("Admin requested deletion of all data for company: {CompanyId}", id);

        var result = await _companyService.DeleteAllCompanyDataAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { success = true, message = "公司所有資料已刪除" });
    }

    /// <summary>
    /// 批次刪除公司
    /// </summary>
    /// <param name="request">批次刪除請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批次操作結果</returns>
    /// <response code="200">成功刪除</response>
    /// <response code="400">刪除失敗</response>
    /// <response code="401">未授權</response>
    /// <response code="403">權限不足</response>
    [HttpDelete("batch")]
    [ProducesResponseType(typeof(Application.DTOs.Member.BatchOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BatchDelete(
        [FromBody] Application.DTOs.Company.BatchDeleteCompanyRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CompanyIds == null || request.CompanyIds.Count == 0)
            return BadRequest(new { error = "公司 ID 列表不可為空" });

        _logger.LogWarning("Admin batch deleting {Count} companies", request.CompanyIds.Count);

        var result = await _companyService.BatchDeleteAsync(request, cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }
}
