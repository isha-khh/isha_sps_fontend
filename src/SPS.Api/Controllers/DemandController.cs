using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Demand;
using SPS.Application.DTOs.File;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Api.Attributes;
using SPS.Domain.Enums;

namespace SPS.Api.Controllers;

/// <summary>
/// 需求管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("需求管理 API")]
public class DemandController : ControllerBase
{
    private readonly IDemandService _demandService;
    private readonly IAdminUserService _adminUserService;
    private readonly IFileManagementService _fileService;

    /// <summary>
    /// 需求控制器建構函數
    /// </summary>
    public DemandController(IDemandService demandService, IAdminUserService adminUserService, IFileManagementService fileService)
    {
        _demandService = demandService;
        _adminUserService = adminUserService;
        _fileService = fileService;
    }

    private const int MaxAttachments = 10;

    /// <summary>
    /// 獲取需求分頁列表
    /// </summary>
    /// <param name="p">查詢參數</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求分頁列表</returns>
    /// <response code="200">成功返回需求列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] DemandQueryParameters p, CancellationToken ct)
    {
        // 匿名可呼叫的公開列表：草稿（未發布）只有後台使用者（Admin 角色）看得到，其他人一律只回已發布
        if (!User.IsInRole("Admin"))
        {
            p.Published = true;
        }

        var r = await _demandService.GetPagedAsync(p, ct);
        if (r.IsSuccess)
        {
            foreach (var item in r.Data!.Items) await ApplyVisibilityAsync(item, includeAttachments: false, ct);
        }

        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 根據 ID 獲取需求詳情
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求詳情</returns>
    /// <response code="200">成功返回需求詳情</response>
    /// <response code="404">需求不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var r = await _demandService.GetByIdAsync(id, ct);
        // 未發布的資料對非後台使用者視同不存在（404，不洩漏草稿存在與否）
        if (r.IsSuccess && r.Data is { Published: false } && !User.IsInRole("Admin"))
        {
            return NotFound(new { error = "資料不存在" });
        }

        if (r.IsSuccess) await ApplyVisibilityAsync(r.Data!, includeAttachments: true, ct);

        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 依呼叫者身分決定看得到多少：後台使用者全部；企業會員（Supplier／Buyer）看得到完整內容與附件但看不到刊登企業；
    /// 其他人（匿名、個人會員）只有標題、摘要等公開資訊，<see cref="DemandResponse.ContentLocked"/> = true
    /// </summary>
    private async Task ApplyVisibilityAsync(DemandResponse demand, bool includeAttachments, CancellationToken ct)
    {
        var isAdmin = User.IsInRole("Admin");
        var isEnterpriseMember = User.IsInRole("Supplier") || User.IsInRole("Buyer");

        if (!isAdmin)
        {
            demand.CompanyId = null;
            demand.CompanyName = null;
        }

        if (isAdmin || isEnterpriseMember)
        {
            if (includeAttachments) demand.Attachments = await ResolveAttachmentsAsync(demand.AttachmentFileIds, ct);
            if (!isAdmin) demand.AttachmentFileIds = new List<Guid>();
            return;
        }

        demand.Introduction = null;
        demand.ContentLocked = true;
        demand.AttachmentFileIds = new List<Guid>();
        demand.Attachments = new List<DemandAttachmentDto>();
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

    private async Task<List<DemandAttachmentDto>> ResolveAttachmentsAsync(IEnumerable<Guid> fileIds, CancellationToken ct)
    {
        var result = new List<DemandAttachmentDto>();
        foreach (var id in fileIds)
        {
            var file = await GetUsableAttachmentAsync(id, ct);
            if (file == null) continue;
            result.Add(new DemandAttachmentDto
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
        if (fileIds.Count > MaxAttachments) return $"附件最多 {MaxAttachments} 個";
        foreach (var id in fileIds)
        {
            if (await GetUsableAttachmentAsync(id, ct) == null) return "附件必須是檔案管理中存在的檔案（不能是資料夾、已刪除的檔案或會員申請附件）";
        }

        return null;
    }

    /// <summary>
    /// 創建新需求
    /// </summary>
    /// <param name="req">創建需求請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>創建的需求</returns>
    /// <response code="201">需求創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateDemandRequest req, CancellationToken ct)
    {
        var attachmentError = await ValidateAttachmentsAsync(req.AttachmentFileIds, ct);
        if (attachmentError != null) return BadRequest(new { error = attachmentError });

        var r = await _demandService.CreateAsync(req, ct);
        return r.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 更新需求
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="req">更新需求請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新後的需求</returns>
    /// <response code="200">需求更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpPut("{id}")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDemandRequest req, CancellationToken ct)
    {
        var attachmentError = await ValidateAttachmentsAsync(req.AttachmentFileIds, ct);
        if (attachmentError != null) return BadRequest(new { error = attachmentError });

        string? publisherEmail = null;
        if (req.Published == true)
        {
            var userIdStr = User.FindFirst("UserId")?.Value;
            if (Guid.TryParse(userIdStr, out var userId))
            {
                var userResult = await _adminUserService.GetByIdAsync(userId, ct);
                publisherEmail = userResult.IsSuccess ? userResult.Data?.Email : null;
            }
        }

        var r = await _demandService.UpdateAsync(id, req, publisherEmail, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 刪除需求
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">需求刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpDelete("{id}")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var r = await _demandService.DeleteAsync(id, ct);
        return r.IsSuccess ? NoContent() : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 獲取需求統計數據
    /// </summary>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求統計數據</returns>
    /// <response code="200">成功返回統計數據</response>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken ct)
    {
        var r = await _demandService.GetStatisticsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 依標籤查詢相似供給端業者（依重疊比例排序）
    /// </summary>
    /// <param name="tagIds">標籤 ID 清單</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單</returns>
    [HttpGet("similar-companies")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilarCompanies([FromQuery] List<int> tagIds, CancellationToken ct)
    {
        var r = await _demandService.GetSimilarCompaniesAsync(tagIds, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// AI 語意搜尋：依需求內容找出語意相似的供給端業者
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單（依語意相關度排序）</returns>
    [HttpGet("{id}/similar-companies-ai")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilarCompaniesByVector(int id, CancellationToken ct)
    {
        var r = await _demandService.GetSimilarCompaniesByVectorAsync(id, ct: ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// AI 語意搜尋即時預覽：新增需求頁尚未儲存前，用當下輸入的名稱/介紹/標籤做一次性查詢，
    /// 不寫入索引。
    /// </summary>
    /// <param name="request">名稱/介紹/標籤</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單（依語意相關度排序）</returns>
    [HttpPost("similar-companies-ai/preview")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> PreviewSimilarCompaniesByVector([FromBody] PreviewSimilarCompaniesRequest request, CancellationToken ct)
    {
        var r = await _demandService.PreviewSimilarCompaniesByVectorAsync(request.Name, request.Introduction, request.TagIds, ct: ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 取得需求目前綁定的標籤
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求標籤綁定</returns>
    /// <response code="200">成功返回標籤綁定</response>
    /// <response code="404">需求不存在</response>
    [HttpGet("{id}/tags")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DemandTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTags(int id, CancellationToken ct)
    {
        var r = await _demandService.GetTagsAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 設定需求標籤（覆寫綁定，支援多個標籤；傳入空集合代表清除）
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="req">標籤設定請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新後的需求標籤綁定</returns>
    /// <response code="200">設定成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpPut("{id}/tags")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DemandTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetTags(int id, [FromBody] SetDemandTagsRequest req, CancellationToken ct)
    {
        var r = await _demandService.SetTagsAsync(id, req, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error?.Contains("不存在") == true
            ? NotFound(new { error = r.Error })
            : BadRequest(new { error = r.Error });
    }

    [HttpGet("{id}/notifications")]
    [RequirePermission(UserPermission.ManageDemands)]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetNotifications(int id, CancellationToken ct)
    {
        var r = await _demandService.GetNotificationsAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }
}
