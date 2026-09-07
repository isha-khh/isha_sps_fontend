using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 會員管理控制器 (管理員用)
/// </summary>
[ApiController]
[Route("api/admin/members")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("會員管理控制器")]
public class MemberController : ControllerBase
{
    private readonly IMemberService _memberService;
    private readonly ILogger<MemberController> _logger;

    public MemberController(IMemberService memberService, ILogger<MemberController> logger)
    {
        _memberService = memberService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢會員列表
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<MemberListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] MemberQueryParameters parameters, CancellationToken cancellationToken)
    {
        var result = await _memberService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取會員詳情
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _memberService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess) return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 更新會員資訊
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(MemberResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMemberRequest request, CancellationToken cancellationToken)
    {
        var result = await _memberService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除會員
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _memberService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 獲取會員統計數據
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _memberService.GetStatisticsAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 管理員重置會員密碼
    /// </summary>
    [HttpPost("{id}/reset-password")]
    [ProducesResponseType(typeof(MemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] AdminResetMemberPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _memberService.ResetPasswordAsync(id, request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 解鎖會員帳戶
    /// </summary>
    [HttpPost("{id}/unlock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnlockMember(Guid id, CancellationToken cancellationToken)
    {
        var result = await _memberService.UnlockMemberAsync(id, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 更新會員信箱驗證狀態
    /// </summary>
    [HttpPut("{id}/email-verification")]
    [ProducesResponseType(typeof(MemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEmailVerification(Guid id, [FromBody] UpdateEmailVerificationRequest request, CancellationToken cancellationToken)
    {
        var result = await _memberService.UpdateEmailVerificationAsync(id, request.IsVerified, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
    /// <summary>
    /// 批次重置會員密碼
    /// </summary>
    [HttpPost("batch/reset-password")]
    [ProducesResponseType(typeof(BatchOperationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchResetPassword([FromBody] BatchResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (request.MemberIds == null || request.MemberIds.Count == 0)
            return BadRequest(new { error = "會員 ID 列表不可為空" });

        var result = await _memberService.BatchResetPasswordAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 批次更新會員信箱驗證狀態
    /// </summary>
    [HttpPut("batch/email-verification")]
    [ProducesResponseType(typeof(BatchOperationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchUpdateEmailVerification([FromBody] BatchUpdateEmailVerificationRequest request, CancellationToken cancellationToken)
    {
        if (request.MemberIds == null || request.MemberIds.Count == 0)
            return BadRequest(new { error = "會員 ID 列表不可為空" });

        var result = await _memberService.BatchUpdateEmailVerificationAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 批次設定要求下次登入修改密碼
    /// </summary>
    [HttpPut("batch/require-password-change")]
    [ProducesResponseType(typeof(BatchOperationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchRequirePasswordChange([FromBody] BatchRequirePasswordChangeRequest request, CancellationToken cancellationToken)
    {
        if (request.MemberIds == null || request.MemberIds.Count == 0)
            return BadRequest(new { error = "會員 ID 列表不可為空" });

        var result = await _memberService.BatchRequirePasswordChangeAsync(request, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// Admin 切換指定聯絡人
    /// </summary>
    [HttpPut("{id}/designated-contact")]
    [ProducesResponseType(typeof(MemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleDesignatedContact(Guid id, [FromBody] AdminToggleDesignatedContactRequest request, CancellationToken cancellationToken)
    {
        var result = await _memberService.ToggleDesignatedContactAsync(id, request.IsDesignatedContact, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
}

/// <summary>
/// Admin 切換指定聯絡人請求
/// </summary>
public class AdminToggleDesignatedContactRequest
{
    public bool IsDesignatedContact { get; set; }
}

/// <summary>
/// 更新信箱驗證狀態請求
/// </summary>
public class UpdateEmailVerificationRequest
{
    /// <summary>
    /// 是否已驗證
    /// </summary>
    public bool IsVerified { get; set; }
}
