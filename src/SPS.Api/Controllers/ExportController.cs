using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

public class ExportCompaniesRequest
{
    public List<Guid>? Ids { get; set; }
    public string? Search { get; set; }
    public CompanyType? Type { get; set; }
    public CompanyLevel? Level { get; set; }
    public Status? Status { get; set; }
    public bool? IsVerified { get; set; }
}

public class ExportProductsRequest
{
    public List<int>? Ids { get; set; }
    public string? Search { get; set; }
    public bool? Published { get; set; }
    public Guid? CompanyId { get; set; }
}

public class ExportMembersRequest
{
    public List<Guid>? Ids { get; set; }
    public string? Search { get; set; }
    public Status? Status { get; set; }
    public MemberRole? Role { get; set; }
    public Guid? CompanyId { get; set; }
    public bool? IsApproved { get; set; }
    public bool? HasCompany { get; set; }
    public bool? IsEmailVerified { get; set; }
}

/// <summary>
/// 匯出控制器
/// </summary>
[ApiController]
[Route("api/export")]
[Authorize]
[SwaggerTag("匯出功能")]
public class ExportController : ControllerBase
{
    private readonly IExcelExportService _excelExportService;
    private readonly ILogger<ExportController> _logger;

    public ExportController(
        IExcelExportService excelExportService,
        ILogger<ExportController> logger)
    {
        _excelExportService = excelExportService;
        _logger = logger;
    }

    /// <summary>
    /// 匯出公司列表為 Excel
    /// </summary>
    [HttpPost("companies")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportCompanies(
        [FromBody] ExportCompaniesRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Exporting companies to Excel: {Count} IDs or filters",
            request.Ids?.Count ?? 0);

        var bytes = await _excelExportService.ExportCompaniesToExcelAsync(
            request.Ids,
            request.Search,
            request.Type,
            request.Level,
            request.Status,
            request.IsVerified,
            cancellationToken);

        var filename = $"公司列表_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename);
    }

    /// <summary>
    /// 匯出會員列表為 Excel
    /// </summary>
    [HttpPost("members")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportMembers(
        [FromBody] ExportMembersRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Exporting members to Excel: {Count} IDs or filters",
            request.Ids?.Count ?? 0);

        var bytes = await _excelExportService.ExportMembersToExcelAsync(
            request.Ids,
            request.Search,
            request.Status,
            request.Role,
            request.CompanyId,
            request.IsApproved,
            request.HasCompany,
            request.IsEmailVerified,
            cancellationToken);

        var filename = $"會員列表_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename);
    }

    /// <summary>
    /// 匯出產品列表為 Excel
    /// </summary>
    [HttpPost("products")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportProducts(
        [FromBody] ExportProductsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Exporting products to Excel: {Count} IDs or filters",
            request.Ids?.Count ?? 0);

        var bytes = await _excelExportService.ExportProductsToExcelAsync(
            request.Ids,
            request.Search,
            request.Published,
            request.CompanyId,
            cancellationToken);

        var filename = $"產品列表_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename);
    }
}
