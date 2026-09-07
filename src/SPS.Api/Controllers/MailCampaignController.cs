using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.MailCampaign;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 群發郵件活動控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
[SwaggerTag("郵件中心 - 群發郵件")]
public class MailCampaignController : ControllerBase
{
    private readonly IMailCampaignService _service;
    private readonly IEmailService _emailService;
    private readonly ILogger<MailCampaignController> _logger;

    public MailCampaignController(
        IMailCampaignService service,
        IEmailService emailService,
        ILogger<MailCampaignController> logger)
    {
        _service = service;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// 預覽收件人數（不寄送）
    /// </summary>
    [HttpPost("preview")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Preview(
        [FromBody] PreviewRecipientRequest request,
        CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var result = await _service.PreviewRecipientCountAsync(
            request.CompanyIds ?? new List<Guid>(),
            request.MemberIds ?? new List<Guid>(),
            request.Filter,
            request.Broadcast,
            cancellationToken);

        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(new { count = result.Data });
    }

    /// <summary>
    /// 預覽信件 HTML（套用版型後的完整內容，供前端 iframe 顯示）
    /// </summary>
    [HttpPost("preview-body")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PreviewBody(
        [FromBody] PreviewBodyRequest request,
        CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var subject = request.Subject ?? string.Empty;
        var body = request.Body ?? string.Empty;

        if (!request.ApplyLayout)
        {
            return Ok(new { html = body });
        }

        // 用實際請求的 origin 做為 baseUrl，方便瀏覽器預覽 logo
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var html = await _emailService.WrapWithLayoutForPreviewAsync(subject, body, baseUrl);
        return Ok(new { html });
    }

    /// <summary>
    /// 預覽收件人清單前 N 筆
    /// </summary>
    [HttpPost("preview-list")]
    [ProducesResponseType(typeof(PreviewRecipientListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PreviewList(
        [FromBody] PreviewRecipientListRequest request,
        CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var result = await _service.PreviewRecipientListAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 測試寄送：把目前撰寫中的主旨/內容套用變數值後寄到指定 email（不建立 Campaign）
    /// </summary>
    [HttpPost("test-send")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> TestSend(
        [FromBody] TestSendCampaignRequest request,
        CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var result = await _service.TestSendAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(new { ok = true });
    }

    /// <summary>
    /// 排入佇列（立即或排程）。實際寄送由背景 worker 處理
    /// </summary>
    [HttpPost("send")]
    [ProducesResponseType(typeof(EnqueueCampaignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Send(
        [FromBody] SendCampaignRequest request,
        CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var operatorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;

        _logger.LogInformation("Enqueuing campaign by {OperatorId} (companies={CompanyCount}, members={MemberCount}, scheduleAt={ScheduleAt})",
            operatorId, request.CompanyIds?.Count ?? 0, request.MemberIds?.Count ?? 0, request.ScheduleAt);

        var result = await _service.EnqueueAsync(request, operatorId, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 取消尚未開始的活動
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var result = await _service.CancelAsync(id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok();
    }

    /// <summary>
    /// 重試指定活動的失敗收件人（PerRecipient 模式專用），會建立新活動
    /// </summary>
    [HttpPost("{id:guid}/retry-failed")]
    [ProducesResponseType(typeof(EnqueueCampaignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RetryFailed(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckBulkSendPermission()) return Forbid();

        var operatorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;

        var result = await _service.RetryFailedAsync(id, operatorId, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 分頁查詢活動列表
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CampaignListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(
        [FromQuery] CampaignListQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (!CheckMailLogsPermission()) return Forbid();

        var result = await _service.ListAsync(parameters, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 活動詳情
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CampaignDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Detail(Guid id, CancellationToken cancellationToken)
    {
        if (!CheckMailLogsPermission()) return Forbid();

        var result = await _service.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess) return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 需 SendBulkEmail，並且至少擁有 ManageMembers 或 ManageCompanies 之一
    /// </summary>
    private bool CheckBulkSendPermission()
    {
        var (ok, perms) = ParsePermissions();
        if (!ok) return false;
        if (perms.HasFlag(UserPermission.All)) return true;
        if (!perms.HasFlag(UserPermission.SendBulkEmail)) return false;
        return perms.HasFlag(UserPermission.ManageMembers)
            || perms.HasFlag(UserPermission.ManageCompanies);
    }

    private bool CheckMailLogsPermission()
    {
        var (ok, perms) = ParsePermissions();
        if (!ok) return false;
        if (perms.HasFlag(UserPermission.All)) return true;
        return perms.HasFlag(UserPermission.ManageMailLogs)
            || perms.HasFlag(UserPermission.SendBulkEmail);
    }

    private (bool ok, UserPermission perms) ParsePermissions()
    {
        var claim = User.FindFirst("Permissions")?.Value;
        if (long.TryParse(claim, out var v)) return (true, (UserPermission)v);
        return (false, UserPermission.None);
    }
}

public class PreviewRecipientRequest
{
    public List<Guid> CompanyIds { get; set; } = new();
    public List<Guid> MemberIds { get; set; } = new();
    public CampaignRecipientFilter? Filter { get; set; }
    public bool Broadcast { get; set; }
}

public class PreviewBodyRequest
{
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public bool ApplyLayout { get; set; } = true;
}
