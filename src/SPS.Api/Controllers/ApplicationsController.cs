using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Application;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 會員申請控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[SwaggerTag("會員申請控制器")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly IBusinessRegistryService _businessRegistryService;
    private readonly ILogger<ApplicationsController> _logger;
    private readonly ISystemSettingService _settingService;

    /// <summary>申請存取密鑰 cookie 的名稱前綴；每份申請一個 cookie（<c>appkey_{申請id}</c>），同時填多份申請不會互相覆蓋</summary>
    private const string KeyCookiePrefix = "appkey_";

    /// <summary>存取密鑰 cookie 的有效天數：夠填完申請與補件，過期就得重新申請</summary>
    private const int KeyCookieDays = 7;

    /// <summary>
    /// 初始化會員申請控制器
    /// </summary>
    /// <param name="applicationService">申請服務</param>
    /// <param name="businessRegistryService">工商登記服務</param>
    /// <param name="logger">日誌記錄器</param>
    public ApplicationsController(
        IApplicationService applicationService,
        IBusinessRegistryService businessRegistryService,
        ILogger<ApplicationsController> logger,
        ISystemSettingService settingService)
    {
        _applicationService = applicationService;
        _businessRegistryService = businessRegistryService;
        _logger = logger;
        _settingService = settingService;
    }

    /// <summary>
    /// 這支控制器的端點都開放匿名（申請人註冊前沒有帳號），所以改成「持有這份申請的密鑰才能存取」：
    /// 建立申請時發一組隨機密鑰存進 HttpOnly cookie，之後讀寫都要出示。
    /// 放行條件：後台使用者有對應權限（讀=ViewApplications、寫=ManageApplications），
    /// 或這份是升級申請且呼叫者就是該會員本人，或 cookie 密鑰正確。
    /// 不符一律回 404，不透露這個 id 存不存在。
    /// </summary>
    private async Task<IActionResult?> DenyUnlessCanAccessAsync(Guid applicationId, bool write, CancellationToken cancellationToken)
    {
        var admin = User.GetAdminPermissions();
        if (write ? admin.HasAny(UserPermission.ManageApplications) : admin.HasAny(UserPermission.ViewApplications))
            return null;

        Guid? memberId = Guid.TryParse(User.FindFirst("MemberId")?.Value, out var m) ? m : null;
        var key = Request.Cookies[KeyCookiePrefix + applicationId];

        return await _applicationService.CanAccessAsync(applicationId, key, memberId, cancellationToken)
            ? null
            : NotFound(new { error = "申請不存在" });
    }

    /// <summary>
    /// 把存取密鑰寫進 HttpOnly cookie（安全設定與登入 cookie 一致，從 DB 的 HttpSecurity 設定讀）
    /// </summary>
    private async Task SetAccessKeyCookieAsync(Guid applicationId, string accessKey, CancellationToken cancellationToken)
    {
        var isProduction = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development";
        var settings = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity", cancellationToken);
        var cookie = settings.Data?.Cookie ?? new CookieSecuritySettingsDto();

        Response.Cookies.Append(KeyCookiePrefix + applicationId, accessKey, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction && cookie.Secure,
            SameSite = (cookie.SameSite ?? "Lax").ToLowerInvariant() switch
            {
                "strict" => SameSiteMode.Strict,
                "none" => SameSiteMode.None,
                _ => SameSiteMode.Lax
            },
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(KeyCookieDays)
        });
    }

    /// <summary>
    /// 查詢企業信息 (統一編號)
    /// </summary>
    /// <param name="unifiedSocialCreditCode">統一編號</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>企業信息</returns>
    /// <response code="200">成功返回企業信息</response>
    /// <response code="404">找不到指定的企業</response>
    [HttpGet("company-info")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CompanyRegistryInfo>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyInfo(
        [FromQuery] string unifiedSocialCreditCode,
        CancellationToken cancellationToken)
    {
        var result = await _businessRegistryService.GetCompanyInfoAsync(unifiedSocialCreditCode, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        // Return as array to match user request format
        return Ok(new[] { result.Data });
    }

    /// <summary>
    /// 創建申請
    /// </summary>
    /// <param name="request">創建申請請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建的申請資訊</returns>
    /// <response code="200">成功創建申請</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateApplication(
        [FromBody] CreateApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _applicationService.CreateApplicationAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        // 密鑰只給這一次：轉成 HttpOnly cookie，不放在回應內容（AccessKey 本身也標了 JsonIgnore）
        if (result.Data!.AccessKey != null)
        {
            await SetAccessKeyCookieAsync(result.Data.Id, result.Data.AccessKey, cancellationToken);
            result.Data.AccessKey = null;
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取申請詳情
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>申請詳細資訊</returns>
    /// <response code="200">成功返回申請詳情</response>
    /// <response code="404">找不到指定的申請</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplication(Guid id, CancellationToken cancellationToken)
    {
        var denied = await DenyUnlessCanAccessAsync(id, write: false, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.GetApplicationByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 更新申請（僅草稿狀態）
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="request">更新申請請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的申請資訊</returns>
    /// <response code="200">成功更新申請</response>
    /// <response code="400">請求參數錯誤或申請狀態不允許更新</response>
    [HttpPut("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateApplication(
        Guid id,
        [FromBody] UpdateApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var denied = await DenyUnlessCanAccessAsync(id, write: true, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.UpdateApplicationAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取我的申請列表
    /// </summary>
    /// <param name="email">（選填，僅相容舊呼叫；一律以登入 token 的信箱查詢，與 token 不符回 403）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>申請列表</returns>
    /// <response code="200">成功返回申請列表</response>
    /// <response code="400">郵箱參數錯誤</response>
    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<ApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyApplications(
        [FromQuery] string? email,
        CancellationToken cancellationToken)
    {
        // 原本匿名、拿 query 的 email 就回該信箱所有申請（含聯絡人/統編等個資），任何人猜信箱就能撈。
        // 改成必須登入，且一律用 token 裡的信箱查；query 帶別人的信箱直接 403
        var tokenEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(tokenEmail))
        {
            return Forbid();
        }

        if (!string.IsNullOrEmpty(email) && !string.Equals(email, tokenEmail, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _applicationService.GetMyApplicationsAsync(tokenEmail, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 提交申請
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="request">提交申請請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>提交後的申請資訊</returns>
    /// <response code="200">成功提交申請</response>
    /// <response code="400">請求參數錯誤或申請狀態不允許提交</response>
    [HttpPost("{id}/submit")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitApplication(
        Guid id,
        [FromBody] SubmitApplicationRequest request,
        CancellationToken cancellationToken)
    {
        if (id != request.ApplicationId)
        {
            return BadRequest(new { error = "申請ID不匹配" });
        }

        var denied = await DenyUnlessCanAccessAsync(id, write: true, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.SubmitApplicationAsync(
            request.ApplicationId,
            request.Remark,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 取消申請
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="request">取消申請請求（可選）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">成功取消申請</response>
    /// <response code="400">請求參數錯誤或申請狀態不允許取消</response>
    [HttpPost("{id}/cancel")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelApplication(
        Guid id,
        [FromBody] CancelApplicationRequest? request,
        CancellationToken cancellationToken)
    {
        var denied = await DenyUnlessCanAccessAsync(id, write: true, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.CancelApplicationAsync(
            id,
            request?.Reason,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { success = true });
    }

    /// <summary>
    /// 上傳文件
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="request">上傳文件請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>上傳的文件資訊</returns>
    /// <response code="200">成功上傳文件</response>
    /// <response code="400">請求參數錯誤或文件格式不支援</response>
    [HttpPost("{id}/documents")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(
        Guid id,
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (id != request.ApplicationId)
        {
            return BadRequest(new { error = "申請ID不匹配" });
        }

        var denied = await DenyUnlessCanAccessAsync(id, write: true, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.UploadDocumentAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除文件
    /// </summary>
    /// <param name="documentId">文件ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">成功刪除文件</response>
    /// <response code="400">請求參數錯誤或文件不存在</response>
    [HttpDelete("documents/{documentId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var owner = await _applicationService.GetApplicationIdByDocumentIdAsync(documentId, cancellationToken);
        if (owner == null) return NotFound(new { error = "文件不存在" });

        var denied = await DenyUnlessCanAccessAsync(owner.Value, write: true, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.DeleteDocumentAsync(documentId, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { success = true });
    }

    /// <summary>
    /// 驗證申請是否可提交
    /// </summary>
    /// <param name="id">申請ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    /// <response code="200">返回驗證結果</response>
    /// <response code="400">驗證失敗，返回錯誤原因</response>
    [HttpGet("{id}/validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateApplication(
        Guid id,
        CancellationToken cancellationToken)
    {
        var denied = await DenyUnlessCanAccessAsync(id, write: false, cancellationToken);
        if (denied != null) return denied;

        var result = await _applicationService.ValidateApplicationForSubmitAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { valid = false, error = result.Error });
        }

        return Ok(new { valid = true });
    }
}

/// <summary>
/// 取消申請請求
/// </summary>
public class CancelApplicationRequest
{
    public string? Reason { get; set; }
}
