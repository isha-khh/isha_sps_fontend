using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
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
    private readonly ILogger<MemberProfileController> _logger;

    public MemberProfileController(
        IMemberProfileService memberProfileService,
        ILogger<MemberProfileController> logger)
    {
        _memberProfileService = memberProfileService;
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
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
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
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        var memberId = GetMemberId();
        if (memberId == null)
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _memberProfileService.UpdateCompanyAsync(memberId.Value, request, cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
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
