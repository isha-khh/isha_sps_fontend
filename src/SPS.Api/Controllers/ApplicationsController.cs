using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Application;
using SPS.Application.Interfaces.IServices;
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

    /// <summary>
    /// 初始化會員申請控制器
    /// </summary>
    /// <param name="applicationService">申請服務</param>
    /// <param name="businessRegistryService">工商登記服務</param>
    /// <param name="logger">日誌記錄器</param>
    public ApplicationsController(
        IApplicationService applicationService,
        IBusinessRegistryService businessRegistryService,
        ILogger<ApplicationsController> logger)
    {
        _applicationService = applicationService;
        _businessRegistryService = businessRegistryService;
        _logger = logger;
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
    /// <param name="email">會員電子郵件</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>申請列表</returns>
    /// <response code="200">成功返回申請列表</response>
    /// <response code="400">郵箱參數錯誤</response>
    [HttpGet("my")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyApplications(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { error = "郵箱不能為空" });
        }

        var result = await _applicationService.GetMyApplicationsAsync(email, cancellationToken);

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
