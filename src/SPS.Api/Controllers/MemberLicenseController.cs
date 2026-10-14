using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.License;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 會員中心「XR 授權」：具資格的會員（企業、需求端或兼營、審核通過）取得序號、看席次與已啟用的裝置、自助停用裝置。
/// 會員身分一律從 token 的 MemberId 取得，只能操作自己的授權。序號明文只在建立與重新產生的回應裡出現一次，回應不快取。
/// </summary>
[ApiController]
[Route("api/member/license")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("會員中心 XR 授權")]
public class MemberLicenseController : ControllerBase
{
    private readonly ILicenseService _licenses;

    public MemberLicenseController(ILicenseService licenses) => _licenses = licenses;

    private Guid? GetMemberId() => Guid.TryParse(User.FindFirst("MemberId")?.Value, out var id) ? id : null;
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private IActionResult From(LicenseResult<MemberLicenseDto> result)
    {
        Response.Headers.CacheControl = "no-store";
        return result.Success ? Ok(result.Data) : StatusCode(result.HttpStatus, new { error = result.ErrorCode, message = result.Message });
    }

    [HttpGet]
    [ProducesResponseType(typeof(MemberLicenseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        Response.Headers.CacheControl = "no-store";
        return Ok(await _licenses.GetMyLicenseAsync(memberId.Value, ct));
    }

    /// <summary>取得 XR 授權序號（第一次）；已經有授權時回傳目前狀態，不會再顯示序號</summary>
    [HttpPost]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        return From(await _licenses.CreateMyLicenseAsync(memberId.Value, ClientIp, ct));
    }

    /// <summary>重新產生序號：舊序號立即失效；已啟用的裝置不受影響</summary>
    [HttpPost("regenerate")]
    public async Task<IActionResult> Regenerate(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        return From(await _licenses.RegenerateMyKeyAsync(memberId.Value, ClientIp, ct));
    }

    /// <summary>停用自己的某一台裝置（釋放席次）</summary>
    [HttpPost("devices/{activationId:guid}/deactivate")]
    public async Task<IActionResult> DeactivateDevice(Guid activationId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        return From(await _licenses.DeactivateMyDeviceAsync(memberId.Value, activationId, ClientIp, ct));
    }
}
