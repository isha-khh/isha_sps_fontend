using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Attributes;
using SPS.Api.Services;
using SPS.Application.DTOs.File;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Member;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 前台會員資料控制器
/// </summary>
[ApiController]
[Route("api/member")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("前台會員資料控制器")]
public class MemberProfileController : ControllerBase
{
    private readonly IMemberProfileService _memberProfileService;
    private readonly ICompanyService _companyService;
    private readonly IFileManagementService _fileService;
    private readonly CompanyShowcaseHelper _showcase;
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemberProfileController> _logger;

    private const long MaxImageBytes = 5 * 1024 * 1024;
    private const int ImageUploadsPerHour = 30;

    public MemberProfileController(
        IMemberProfileService memberProfileService,
        ICompanyService companyService,
        IFileManagementService fileService,
        CompanyShowcaseHelper showcase,
        IMemoryCache cache,
        ILogger<MemberProfileController> logger)
    {
        _memberProfileService = memberProfileService;
        _companyService = companyService;
        _fileService = fileService;
        _showcase = showcase;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// 取得個人資料
    /// </summary>
    [HttpGet("profile")]
    [SwaggerOperation(Summary = "取得個人資料")]
    [ProducesResponseType(typeof(MemberProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.GetProfileAsync(memberId.Value, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新個人資料
    /// </summary>
    [HttpPut("profile")]
    [SwaggerOperation(Summary = "更新個人資料")]
    [ProducesResponseType(typeof(MemberProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateMemberProfileRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.UpdateProfileAsync(memberId.Value, request, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    [HttpPost("send-verification-code")]
    [SwaggerOperation(Summary = "發送驗證碼")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendVerificationCode(
        [FromBody] SendVerificationCodePurposeRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.SendVerificationCodeAsync(memberId.Value, request.Purpose, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "驗證碼已發送至您的郵箱" });
    }

    /// <summary>
    /// 修改密碼
    /// </summary>
    [HttpPost("change-password")]
    [SwaggerOperation(Summary = "修改密碼")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] MemberChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.ChangePasswordAsync(memberId.Value, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "密碼已成功修改" });
    }

    /// <summary>
    /// 驗證信箱
    /// </summary>
    [HttpPost("verify-email")]
    [SwaggerOperation(Summary = "驗證信箱")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.VerifyEmailAsync(memberId.Value, request.VerificationCode, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "信箱已成功驗證" });
    }

    // ==================== 公司相關端點 ====================

    /// <summary>
    /// 取得公司資料
    /// </summary>
    [HttpGet("company")]
    [MemberPermissionRequired(MemberPermission.ViewCompany)]
    [SwaggerOperation(Summary = "取得公司資料")]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCompany(CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.GetCompanyAsync(memberId.Value, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await _showcase.ResolveAsync(result.Data!, cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 更新公司資料
    /// </summary>
    [HttpPut("company")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "更新公司資料")]
    [ProducesResponseType(typeof(CompanyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCompany(
        [FromBody] MemberUpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        // 圖片必須是檔案管理中可用的圖片（也擋掉別人的會員申請附件）；LOGO 同樣只收圖片
        var imageError = await _showcase.ValidateAsync(cancellationToken, request.ProductImageFileIds, request.AwardImageFileIds);
        if (imageError == null && request.LogoFileId.HasValue && await _showcase.GetUsableImageAsync(request.LogoFileId.Value, cancellationToken) == null)
        {
            imageError = "LOGO 必須是已上傳的圖片檔案";
        }

        if (imageError != null) return BadRequest(new { error = imageError });

        var result = await _memberProfileService.UpdateCompanyAsync(memberId.Value, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await _showcase.ResolveAsync(result.Data!, cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 取得公司目前綁定的企業標籤（應用情境／應用範疇／智慧技術）
    /// </summary>
    [HttpGet("company/tags")]
    [MemberPermissionRequired(MemberPermission.ViewCompany)]
    [SwaggerOperation(Summary = "取得公司標籤")]
    public async Task<IActionResult> GetCompanyTags(CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var company = await _memberProfileService.GetCompanyAsync(memberId.Value, cancellationToken);
        if (!company.IsSuccess) return BadRequest(new { error = company.Error });

        var tags = await _companyService.GetTagsAsync(company.Data!.Id, cancellationToken);
        return tags.IsSuccess ? Ok(tags.Data) : BadRequest(new { error = tags.Error });
    }

    /// <summary>
    /// 設定公司的企業標籤（覆寫）
    /// </summary>
    [HttpPut("company/tags")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "設定公司標籤")]
    public async Task<IActionResult> SetCompanyTags([FromBody] SetCompanyTagsRequest request, CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var company = await _memberProfileService.GetCompanyAsync(memberId.Value, cancellationToken);
        if (!company.IsSuccess) return BadRequest(new { error = company.Error });

        var tags = await _companyService.SetTagsAsync(company.Data!.Id, request, cancellationToken);
        return tags.IsSuccess ? Ok(tags.Data) : BadRequest(new { error = tags.Error });
    }

    /// <summary>
    /// 上傳公司圖片（LOGO、主要產品暨服務示意圖、獲獎事蹟圖片）。只收 JPG／PNG／WebP／GIF、5MB 以內，
    /// 以檔案內容的檔頭判斷（不信任副檔名與 Content-Type）；不收 SVG（可夾帶腳本）。回傳的 fileId 再放進更新公司資料的請求。
    /// 每個會員每小時最多 30 張。
    /// </summary>
    [HttpPost("company/images")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [RequestSizeLimit(MaxImageBytes + 1024 * 64)]
    [SwaggerOperation(Summary = "上傳公司圖片")]
    public async Task<IActionResult> UploadCompanyImage(IFormFile file, CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        if (file == null || file.Length == 0) return BadRequest(new { error = "請選擇圖片檔案" });
        if (file.Length > MaxImageBytes) return BadRequest(new { error = "圖片不能超過 5MB" });

        var header = new byte[12];
        await using (var stream = file.OpenReadStream())
        {
            var read = await stream.ReadAsync(header, cancellationToken);
            if (read < 12) return BadRequest(new { error = "不是有效的圖片檔案" });
        }

        var contentType = DetectImageType(header);
        if (contentType == null) return BadRequest(new { error = "只接受 JPG、PNG、WebP、GIF 圖片" });

        var key = $"member-image-upload:{memberId}";
        var count = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref count[0]) > ImageUploadsPerHour)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "上傳次數過多，請稍後再試" });
        }

        // 檔名副檔名與 Content-Type 都改成依檔頭判斷的結果：用戶端送的 Content-Type／副檔名可以造假，
        // 公開下載時會用儲存的 Content-Type 回應，不能讓人把網頁內容標成 image/png 以外的類型
        var extension = contentType switch { "image/jpeg" => ".jpg", "image/png" => ".png", "image/gif" => ".gif", _ => ".webp" };
        var baseName = Path.GetFileNameWithoutExtension(file.FileName);
        var memory = new MemoryStream();
        await using (var source = file.OpenReadStream())
        {
            await source.CopyToAsync(memory, cancellationToken);
        }

        memory.Position = 0;
        var safeFile = new FormFile(memory, 0, memory.Length, "file", $"{baseName}{extension}")
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };

        var upload = await _fileService.UploadFileAsync(
            new FileUploadRequest { File = safeFile, Description = "企業會員上傳的公司圖片", Tags = "company-image", IsPublic = true },
            memberId.Value,
            cancellationToken);
        if (!upload.IsSuccess) return BadRequest(new { error = upload.Error });

        return Ok(new { fileId = upload.Data!.FileId, fileName = upload.Data.FileName, url = $"/api/FileManagement/{upload.Data.FileId}/download", contentType });
    }

    private static string? DetectImageType(byte[] h)
    {
        if (h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF) return "image/jpeg";
        if (h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) return "image/png";
        if (h[0] == 0x47 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x38) return "image/gif";
        if (h[0] == 0x52 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x46 && h[8] == 0x57 && h[9] == 0x45 && h[10] == 0x42 && h[11] == 0x50) return "image/webp";
        return null;
    }

    /// <summary>
    /// 取得公司成員列表
    /// </summary>
    [HttpGet("company/members")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "取得公司成員列表")]
    [ProducesResponseType(typeof(List<MemberListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCompanyMembers(CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.GetCompanyMembersAsync(memberId.Value, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 強制重置成員密碼
    /// </summary>
    [HttpPost("company/members/{id}/reset-password")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "強制重置成員密碼")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetMemberPassword(
        Guid id,
        [FromBody] ResetMemberPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.ResetMemberPasswordAsync(memberId.Value, id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "成員密碼已重置" });
    }

    // ==================== 公司成員管理端點 ====================

    /// <summary>
    /// 新增公司成員
    /// </summary>
    [HttpPost("company/members")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "新增公司成員")]
    [ProducesResponseType(typeof(MemberListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateCompanyMember(
        [FromBody] CreateCompanyMemberRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var result = await _memberProfileService.CreateCompanyMemberAsync(memberId.Value, request, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新公司成員
    /// </summary>
    [HttpPut("company/members/{id}")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "更新公司成員")]
    [ProducesResponseType(typeof(MemberListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCompanyMember(
        Guid id,
        [FromBody] UpdateCompanyMemberRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var result = await _memberProfileService.UpdateCompanyMemberAsync(memberId.Value, id, request, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 刪除公司成員
    /// </summary>
    [HttpDelete("company/members/{id}")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "刪除公司成員")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteCompanyMember(
        Guid id,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var result = await _memberProfileService.DeleteCompanyMemberAsync(memberId.Value, id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 切換指定聯絡人
    /// </summary>
    [HttpPut("company/members/{id}/designated-contact")]
    [MemberPermissionRequired(MemberPermission.EditCompany)]
    [SwaggerOperation(Summary = "切換指定聯絡人")]
    [ProducesResponseType(typeof(MemberListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ToggleDesignatedContact(
        Guid id,
        [FromBody] ToggleDesignatedContactRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });

        var result = await _memberProfileService.ToggleDesignatedContactAsync(memberId.Value, id, request.IsDesignatedContact, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    private Guid? GetMemberId()
    {
        var memberIdClaim = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(memberIdClaim) || !Guid.TryParse(memberIdClaim, out var memberId))
        {
            return null;
        }
        return memberId;
    }
}

/// <summary>
/// 發送驗證碼用途請求
/// </summary>
public class SendVerificationCodePurposeRequest
{
    /// <summary>
    /// 驗證碼用途
    /// </summary>
    public VerificationCodePurpose Purpose { get; set; }
}

/// <summary>
/// 驗證信箱請求
/// </summary>
public class VerifyEmailRequest
{
    /// <summary>
    /// 驗證碼
    /// </summary>
    public string VerificationCode { get; set; } = string.Empty;
}

/// <summary>
/// 切換指定聯絡人請求
/// </summary>
public class ToggleDesignatedContactRequest
{
    /// <summary>
    /// 是否為指定聯絡對象
    /// </summary>
    public bool IsDesignatedContact { get; set; }
}
