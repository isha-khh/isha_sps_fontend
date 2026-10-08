using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.File;
using SPS.Application.DTOs.News;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Api.Attributes;
using SPS.Domain.Enums;

namespace SPS.Api.Controllers;

/// <summary>
/// 新聞管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("新聞管理控制器")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;
    private readonly IFileManagementService _fileService;
    private readonly ILogger<NewsController> _logger;
    private readonly IMemoryCache _cache;

    private const int MaxAttachments = 10;

    /// <summary>同一個來源 IP 對同一篇公告，這段時間內只累計一次瀏覽數</summary>
    private static readonly TimeSpan ViewDedupeWindow = TimeSpan.FromMinutes(30);

    /// <summary>
    /// 初始化新聞管理控制器
    /// </summary>
    /// <param name="newsService">新聞服務</param>
    /// <param name="logger">日誌記錄器</param>
    public NewsController(
        INewsService newsService,
        IFileManagementService fileService,
        ILogger<NewsController> logger,
        IMemoryCache cache)
    {
        _newsService = newsService;
        _fileService = fileService;
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// 分頁查詢新聞列表
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞分頁列表</returns>
    /// <response code="200">成功返回新聞列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<NewsListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] NewsQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged news");

        // 這支是匿名可呼叫的公開列表，同時也是後台公告列表在用。草稿（未發布）只有後台使用者
        // （Admin 角色）看得到；其他人（含前台會員）一律只回已發布，不能靠帶 `published=false`
        // 或不帶這個參數看到草稿
        if (!User.IsInRole("Admin"))
        {
            parameters.Published = true;
        }

        var result = await _newsService.GetPagedAsync(parameters, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取新聞詳情
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞詳細資訊</returns>
    /// <response code="200">成功返回新聞詳情</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting news by ID: {NewsId}", id);

        var result = await _newsService.GetByIdAsync(id, cancellationToken);

        // 未發布的公告對非後台使用者視同不存在（回 404，不洩漏草稿存在與否）
        if (!result.IsSuccess || (!result.Data!.Published && !User.IsInRole("Admin")))
        {
            return NotFound(new { error = result.Error ?? "新聞不存在" });
        }

        // 附件下載資訊：已發布公告的附件任何人都可以下載；檔案 Id 只有後台編輯表單需要，不給匿名者
        result.Data!.Attachments = await ResolveAttachmentsAsync(result.Data.AttachmentFileIds, cancellationToken);
        if (!User.IsInRole("Admin")) result.Data.AttachmentFileIds = new List<Guid>();

        return Ok(result.Data);
    }

    private async Task<FileInfoResponse?> GetUsableAttachmentAsync(Guid fileId, CancellationToken ct)
    {
        var info = await _fileService.GetFileByIdAsync(fileId, ct);
        if (!info.IsSuccess || info.Data == null) return null;
        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return null;
        // 會員申請附件含申請人個資，不能當公開下載檔
        if (await _fileService.IsApplicationDocumentFileAsync(file.Id, ct)) return null;
        return file;
    }

    private async Task<List<NewsAttachmentDto>> ResolveAttachmentsAsync(IEnumerable<Guid> fileIds, CancellationToken ct)
    {
        var result = new List<NewsAttachmentDto>();
        foreach (var id in fileIds)
        {
            var file = await GetUsableAttachmentAsync(id, ct);
            if (file == null) continue;
            result.Add(new NewsAttachmentDto
            {
                FileId = file.Id,
                FileName = file.OriginalFileName,
                FormattedFileSize = file.FormattedFileSize,
                Url = $"/api/FileManagement/{file.Id}/download",
            });
        }

        return result;
    }

    /// <summary>檢查後台送來的附件清單：數量上限、每個檔案都要是檔案管理中可用的檔案（不是資料夾、沒被刪除、不是會員申請附件）</summary>
    private async Task<string?> ValidateAttachmentsAsync(List<Guid>? fileIds, CancellationToken ct)
    {
        if (fileIds == null) return null;
        if (fileIds.Distinct().Count() > MaxAttachments) return $"附件最多 {MaxAttachments} 個";
        foreach (var id in fileIds.Distinct())
        {
            if (await GetUsableAttachmentAsync(id, ct) == null) return "附件必須是檔案管理中存在的檔案（不能是資料夾、已刪除的檔案或會員申請附件）";
        }

        return null;
    }

    /// <summary>
    /// 創建新聞
    /// </summary>
    /// <param name="request">創建新聞請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的新聞資訊</returns>
    /// <response code="201">成功創建新聞</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [RequirePermission(UserPermission.ManageNews)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateNewsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating news: {Title}", request.Title);

        var attachmentError = await ValidateAttachmentsAsync(request.AttachmentFileIds, cancellationToken);
        if (attachmentError != null) return BadRequest(new { error = attachmentError });

        var result = await _newsService.CreateAsync(request, cancellationToken);

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
    /// 更新新聞
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="request">更新新聞請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的新聞資訊</returns>
    /// <response code="200">成功更新新聞</response>
    /// <response code="400">請求參數錯誤</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpPut("{id}")]
    [RequirePermission(UserPermission.ManageNews)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(NewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateNewsRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating news: {NewsId}", id);

        var attachmentError = await ValidateAttachmentsAsync(request.AttachmentFileIds, cancellationToken);
        if (attachmentError != null) return BadRequest(new { error = attachmentError });

        var result = await _newsService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error?.Contains("不存在") == true
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除新聞
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">成功刪除新聞</response>
    /// <response code="401">未授權</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpDelete("{id}")]
    [RequirePermission(UserPermission.ManageNews)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting news: {NewsId}", id);

        var result = await _newsService.DeleteAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>
    /// 獲取新聞統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新聞統計數據</returns>
    /// <response code="200">成功返回統計數據</response>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting news statistics");

        var result = await _newsService.GetStatisticsAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 增加新聞瀏覽次數
    /// </summary>
    /// <param name="id">新聞ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的瀏覽次數</returns>
    /// <response code="200">成功增加瀏覽次數</response>
    /// <response code="404">找不到指定的新聞</response>
    [HttpPost("{id}/view")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IncrementViewCount(
        int id,
        CancellationToken cancellationToken)
    {
        // 這支是匿名、不需要 CSRF token 的計數 API，任何人都能對著它狂打來灌「熱門公告」排名；
        // 同一個來源 IP 對同一篇 30 分鐘內只累計一次（前台頁面另外還有 sessionStorage 去重）。
        // 後台使用者預覽公告不算瀏覽
        if (User.IsInRole("Admin"))
        {
            return Ok(new { counted = false });
        }

        var dedupeKey = $"news-view:{HttpContext.Connection.RemoteIpAddress}:{id}";
        if (_cache.TryGetValue(dedupeKey, out _))
        {
            return Ok(new { counted = false });
        }

        var result = await _newsService.IncrementViewCountAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        _cache.Set(dedupeKey, true, ViewDedupeWindow);
        return Ok(new { counted = true, viewCount = result.Data });
    }
}
