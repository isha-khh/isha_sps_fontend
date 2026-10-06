using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.File;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Api.Attributes;
using SPS.Domain.Enums;

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
    private readonly IFileManagementService _fileService;
    private readonly IMemoryCache _cache;

    private const int MaxShowcaseImages = 12;
    private const int ContactRequestsPerHour = 30;

    public CompanyController(
        ICompanyService companyService,
        ILogger<CompanyController> logger,
        IFileManagementService fileService,
        IMemoryCache cache)
    {
        _companyService = companyService;
        _logger = logger;
        _fileService = fileService;
        _cache = cache;
    }

    /// <summary>檔案管理中可當公開圖片用的檔案：存在、不是資料夾、沒被刪除、是圖片、不是會員申請附件</summary>
    private async Task<FileInfoResponse?> GetUsableImageAsync(Guid fileId, CancellationToken ct)
    {
        var info = await _fileService.GetFileByIdAsync(fileId, ct);
        if (!info.IsSuccess || info.Data == null) return null;
        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return null;
        if (file.ContentType == null || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return null;
        if (await _fileService.IsApplicationDocumentFileAsync(file.Id, ct)) return null;
        return file;
    }

    private async Task<List<CompanyImageDto>> ResolveImagesAsync(IEnumerable<Guid> fileIds, CancellationToken ct)
    {
        var images = new List<CompanyImageDto>();
        foreach (var id in fileIds)
        {
            var file = await GetUsableImageAsync(id, ct);
            if (file == null) continue;
            images.Add(new CompanyImageDto { FileId = file.Id, FileName = file.OriginalFileName, Url = $"/api/FileManagement/{file.Id}/download" });
        }

        return images;
    }

    private async Task ResolveShowcaseImagesAsync(CompanyResponse company, CancellationToken ct)
    {
        company.ProductImages = await ResolveImagesAsync(company.ProductImageFileIds, ct);
        company.AwardImages = await ResolveImagesAsync(company.AwardImageFileIds, ct);
    }

    private async Task<string?> ValidateShowcaseImagesAsync(List<Guid>? productIds, List<Guid>? awardIds, CancellationToken ct)
    {
        foreach (var ids in new[] { productIds, awardIds })
        {
            if (ids == null) continue;
            if (ids.Count > MaxShowcaseImages) return $"圖片最多 {MaxShowcaseImages} 張";
            foreach (var id in ids)
            {
                if (await GetUsableImageAsync(id, ct) == null) return "圖片必須是檔案管理中存在的圖片檔案（不能是資料夾、已刪除的檔案或會員申請附件）";
            }
        }

        return null;
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

        // 匿名可呼叫的公開名錄：只回已審核通過且狀態為啟用的企業，其他（待審、停權、鎖定…）只有後台看得到
        if (!User.IsInRole("Admin"))
        {
            parameters.IsVerified = true;
            parameters.Status = Status.Active;
        }

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

        // 還沒審核通過或已停用的企業，對非後台使用者視同不存在（不洩漏存在與否）
        if (!IsPubliclyVisible(result.Data!))
        {
            return NotFound(new { error = "企業不存在" });
        }

        await ResolveShowcaseImagesAsync(result.Data!, cancellationToken);
        return Ok(HideInternalFields(result.Data!));
    }

    /// <summary>
    /// 取得企業的聯繫窗口（企業名錄「取得聯繫窗口」）。只有登入的企業會員（Supplier／Buyer）與後台使用者可以呼叫；
    /// 聯絡人姓名與電話是個資，不放在公開的企業詳情裡。每個帳號每小時最多 30 次，並記錄是誰查了哪家企業。
    /// </summary>
    [HttpPost("{id}/contact-request")]
    [Authorize]
    [ProducesResponseType(typeof(CompanyContactResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> RequestContact(Guid id, [FromBody] CompanyContactRequest? request, CancellationToken cancellationToken)
    {
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && !User.IsInRole("Supplier") && !User.IsInRole("Buyer"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "僅企業會員可以取得聯絡窗口" });
        }

        var who = User.FindFirst("MemberId")?.Value ?? User.FindFirst("UserId")?.Value ?? "unknown";
        var key = $"company-contact:{who}";
        var count = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref count[0]) > ContactRequestsPerHour)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "查詢次數過多，請稍後再試" });
        }

        var result = await _companyService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess || !IsPubliclyVisible(result.Data!))
        {
            return NotFound(new { error = "企業不存在" });
        }

        var company = result.Data!;
        // 優先用後台指定的聯絡窗口，沒有就用公司負責人
        var designated = company.DesignatedContacts?.FirstOrDefault();
        var name = designated?.Name ?? company.Charge;
        var phone = designated != null
            ? (string.IsNullOrWhiteSpace(designated.MobilePhone) ? designated.Phone : designated.MobilePhone)
            : (string.IsNullOrWhiteSpace(company.ChargePhone) ? company.ChargeMobile : company.ChargePhone);
        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(phone))
        {
            return NotFound(new { error = "這家企業尚未提供聯絡窗口，請洽平台承辦單位" });
        }

        var scopes = (request?.Scopes ?? new List<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).Where(s => s.Length <= 50).Take(20).ToList();
        _logger.LogInformation("Company contact requested: caller={Caller} company={CompanyId} scopes={Scopes}", who, id, string.Join(",", scopes));

        return Ok(new CompanyContactResponse { ContactName = name ?? string.Empty, ContactPhone = phone ?? string.Empty });
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

        if (!IsPubliclyVisible(result.Data!))
        {
            return NotFound(new { error = "企業不存在" });
        }

        await ResolveShowcaseImagesAsync(result.Data!, cancellationToken);
        return Ok(HideInternalFields(result.Data!));
    }

    /// <summary>
    /// 創建企業
    /// </summary>
    /// <param name="request">創建請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的企業</returns>
    [HttpPost]
    [RequirePermission(UserPermission.ManageCompanies)]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating company: {CompanyName}", request.Name);

        var imageError = await ValidateShowcaseImagesAsync(request.ProductImageFileIds, request.AwardImageFileIds, cancellationToken);
        if (imageError != null) return BadRequest(new { error = imageError });

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
    [RequirePermission(UserPermission.ManageCompanies)]
    [Authorize(Roles = "Admin")]
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

        var imageError = await ValidateShowcaseImagesAsync(request.ProductImageFileIds, request.AwardImageFileIds, cancellationToken);
        if (imageError != null) return BadRequest(new { error = imageError });

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
    [RequirePermission(UserPermission.ManageCompanies)]
    [Authorize(Roles = "Admin")]
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
    [RequirePermission(UserPermission.ManageCompanies)]
    [Authorize(Roles = "Admin")]
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
    [RequirePermission(UserPermission.ManageCompanies)]
    [Authorize(Roles = "Admin")]
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

    /// <summary>
    /// 詳情端點是匿名可呼叫的公開資料，但回傳的 <see cref="CompanyResponse"/> 同時是後台編輯用的完整資料：
    /// 負責人姓名／信箱／電話／手機、窗口名單、內部備註、營收、驗證時間都不該給匿名者或一般會員。
    /// 非後台使用者（Admin 角色）一律清掉這些欄位；後台照舊回完整資料。
    /// </summary>
    /// <summary>後台使用者看得到全部；其他人只看得到已審核通過且啟用的企業</summary>
    private bool IsPubliclyVisible(CompanyResponse company) =>
        User.IsInRole("Admin") || (company.IsVerified && company.Status == Status.Active);

    private CompanyResponse HideInternalFields(CompanyResponse company)
    {
        if (User.IsInRole("Admin"))
        {
            return company;
        }

        company.Charge = null;
        company.ChargeEmail = null;
        company.ChargePhone = null;
        company.ChargeMobile = null;
        company.ChargeJobTitle = null;
        company.Remark = null;
        company.Revenue = null;
        company.VerifiedAt = null;
        company.DesignatedContacts = null;
        return company;
    }
}
