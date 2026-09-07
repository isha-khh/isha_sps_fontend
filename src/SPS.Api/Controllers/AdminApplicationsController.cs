using System.IO.Compression;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Application;
using SPS.Application.Interfaces.IServices;
using System.Security.Claims;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 管理員申請審核控制器
/// </summary>
[ApiController]
[Route("api/admin/applications")]
[Authorize(Roles = "SuperAdmin,Reviewer")]
[SwaggerTag("管理員申請審核控制器")]
public class AdminApplicationsController : ControllerBase
{
    private readonly IApplicationReviewService _reviewService;
    private readonly IApplicationService _applicationService;
    private readonly ILogger<AdminApplicationsController> _logger;

    public AdminApplicationsController(
        IApplicationReviewService reviewService,
        IApplicationService applicationService,
        ILogger<AdminApplicationsController> logger)
    {
        _reviewService = reviewService;
        _applicationService = applicationService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取待審核申請列表
    /// </summary>
    /// <param name="pageIndex">頁碼（預設為1）</param>
    /// <param name="pageSize">每頁筆數（預設為20）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>待審核申請分頁列表</returns>
    /// <response code="200">成功返回待審核申請列表</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingApplications(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _reviewService.GetPendingApplicationsAsync(pageIndex, pageSize, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取審核中申請列表
    /// </summary>
    /// <param name="reviewerId">審核員ID（可選，不提供則返回所有審核中的申請）</param>
    /// <param name="pageIndex">頁碼（預設為1）</param>
    /// <param name="pageSize">每頁筆數（預設為20）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>審核中申請分頁列表</returns>
    /// <response code="200">成功返回審核中申請列表</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpGet("under-review")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetApplicationsUnderReview(
        [FromQuery] Guid? reviewerId = null,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _reviewService.GetApplicationsUnderReviewAsync(
            reviewerId,
            pageIndex,
            pageSize,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取已完成申請列表
    /// </summary>
    /// <param name="status">申請狀態（可選，如：Approved、Rejected）</param>
    /// <param name="pageIndex">頁碼（預設為1）</param>
    /// <param name="pageSize">每頁筆數（預設為20）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>已完成申請分頁列表</returns>
    /// <response code="200">成功返回已完成申請列表</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpGet("completed")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCompletedApplications(
        [FromQuery] string? status = null,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Domain.Enums.ApplicationStatus? appStatus = null;
        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<Domain.Enums.ApplicationStatus>(status, true, out var parsed))
            {
                appStatus = parsed;
            }
        }

        var result = await _reviewService.GetCompletedApplicationsAsync(
            appStatus,
            pageIndex,
            pageSize,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 領取申請
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>領取後的申請資訊</returns>
    /// <response code="200">成功領取申請</response>
    /// <response code="400">請求參數錯誤或申請狀態不允許領取</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpPost("{id}/claim")]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClaimApplication(
        Guid id,
        CancellationToken cancellationToken)
    {
        var reviewerId = GetCurrentUserId();
        if (!reviewerId.HasValue)
        {
            return Unauthorized(new { error = "無法獲取當前用戶ID" });
        }

        var result = await _reviewService.ClaimApplicationAsync(id, reviewerId.Value, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 審核申請
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="request">審核申請請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>審核後的申請資訊</returns>
    /// <response code="200">成功審核申請</response>
    /// <response code="400">請求參數錯誤或申請狀態不允許審核</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpPost("{id}/review")]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReviewApplication(
        Guid id,
        [FromBody] ReviewApplicationRequest request,
        CancellationToken cancellationToken)
    {
        if (id != request.ApplicationId)
        {
            return BadRequest(new { error = "申請ID不匹配" });
        }

        var reviewerId = GetCurrentUserId();
        if (!reviewerId.HasValue)
        {
            return Unauthorized(new { error = "無法獲取當前用戶ID" });
        }

        request.ReviewerId = reviewerId.Value;

        // 獲取客戶端IP地址
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _reviewService.ReviewApplicationAsync(request, ipAddress, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取申請統計
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>申請統計資訊</returns>
    /// <response code="200">成功返回統計資訊</response>
    /// <response code="400">請求失敗</response>
    /// <response code="401">未授權或權限不足</response>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetApplicationStatisticsAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 下載單個附件
    /// </summary>
    [HttpGet("documents/{documentId}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var result = await _applicationService.DownloadDocumentAsync(documentId, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var (fileStream, fileName, contentType) = result.Data;
        return File(fileStream, contentType, fileName);
    }

    /// <summary>
    /// 打包下載所有附件
    /// </summary>
    [HttpGet("{id}/documents/download-all")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadAllDocuments(
        Guid id,
        CancellationToken cancellationToken)
    {
        var docsResult = await _applicationService.GetDocumentsByApplicationIdAsync(id, cancellationToken);
        if (!docsResult.IsSuccess)
        {
            return BadRequest(new { error = docsResult.Error });
        }

        var documents = docsResult.Data!;
        if (documents.Count == 0)
        {
            return BadRequest(new { error = "沒有可下載的附件" });
        }

        var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            foreach (var doc in documents)
            {
                var downloadResult = await _applicationService.DownloadDocumentAsync(doc.Id, cancellationToken);
                if (!downloadResult.IsSuccess) continue;

                var (fileStream, fileName, _) = downloadResult.Data;
                var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                await using var entryStream = entry.Open();
                await fileStream.CopyToAsync(entryStream, cancellationToken);
                await fileStream.DisposeAsync();
            }
        }

        memoryStream.Position = 0;
        return File(memoryStream, "application/zip", $"application-{id}-documents.zip");
    }

    /// <summary>
    /// 管理員上傳附件（UnderReview 狀態）
    /// </summary>
    [HttpPost("{id}/documents/upload")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(
        Guid id,
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        request.ApplicationId = id;
        var result = await _applicationService.UploadDocumentAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 管理員刪除附件（UnderReview 狀態）
    /// </summary>
    [HttpDelete("documents/{documentId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var result = await _applicationService.DeleteDocumentAsync(documentId, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { success = true });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }

        return null;
    }
}
