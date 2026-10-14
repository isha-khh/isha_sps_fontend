using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.License;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台「XR 授權」：授權清單與詳情、暫停／恢復／撤銷、調整席次與期限、裝置管理、稽核事件、簽章金鑰（Cloud KMS 登錄）、授權設定。
/// 整個控制器要求後台身分與 <see cref="UserPermission.ManageLicenses"/>。後台不會看到任何序號明文（只存雜湊與遮罩）。
/// </summary>
[ApiController]
[Route("api/admin/licenses")]
[Authorize(Roles = "Admin")]
[RequirePermission(UserPermission.ManageLicenses)]
[Produces("application/json")]
[SwaggerTag("後台 XR 授權管理")]
public class AdminLicenseController : ControllerBase
{
    private readonly ILicenseService _licenses;

    public AdminLicenseController(ILicenseService licenses) => _licenses = licenses;

    private string Actor => $"admin:{User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown"}";
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private IActionResult From<T>(LicenseResult<T> result)
        => result.Success ? Ok(result.Data) : StatusCode(result.HttpStatus, new { error = result.Message, code = result.ErrorCode });

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct) => Ok(await _licenses.GetStatsAsync(ct));

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] AdminLicenseQuery query, CancellationToken ct)
    {
        var (items, total) = await _licenses.ListAsync(query, ct);
        return Ok(new { items, totalCount = total, page = Math.Max(1, query.Page), pageSize = Math.Clamp(query.PageSize, 1, 100) });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detail(Guid id, CancellationToken ct)
    {
        var detail = await _licenses.GetDetailAsync(id, ct);
        return detail == null ? NotFound(new { error = "找不到授權" }) : Ok(detail);
    }

    [HttpGet("{id:guid}/events")]
    public async Task<IActionResult> Events(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken ct = default)
    {
        var (items, total) = await _licenses.ListEventsAsync(id, page, pageSize, ct);
        return Ok(new { items, totalCount = total, page = Math.Max(1, page), pageSize = Math.Clamp(pageSize, 1, 100) });
    }

    /// <summary>調整席次（0＝改用預設）、租約天數（0＝改用預設）、授權期限、備註</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AdminUpdateLicenseRequest request, CancellationToken ct)
        => From(await _licenses.AdminUpdateAsync(id, request, Actor, ClientIp, ct));

    /// <summary>暫停（suspend）／恢復（restore）／撤銷（revoke，必填原因，撤銷後不能恢復）</summary>
    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] AdminLicenseStatusRequest request, CancellationToken ct)
        => From(await _licenses.AdminSetStatusAsync(id, request, Actor, ClientIp, ct));

    /// <summary>遠端停用某一台裝置（該裝置下次續期會被拒）</summary>
    [HttpPost("{id:guid}/devices/{activationId:guid}/revoke")]
    public async Task<IActionResult> RevokeDevice(Guid id, Guid activationId, CancellationToken ct)
        => From(await _licenses.AdminRevokeDeviceAsync(id, activationId, Actor, ClientIp, ct));

    /// <summary>作廢目前的序號（序號外流時用）；會員要自己到會員中心重新產生</summary>
    [HttpPost("{id:guid}/invalidate-key")]
    public async Task<IActionResult> InvalidateKey(Guid id, CancellationToken ct)
        => From(await _licenses.AdminInvalidateKeyAsync(id, Actor, ClientIp, ct));

    // ---------- 簽章金鑰（Cloud KMS）----------

    [HttpGet("keys")]
    public async Task<IActionResult> Keys(CancellationToken ct) => Ok(await _licenses.ListSigningKeysAsync(ct));

    /// <summary>登錄 KMS 金鑰版本：後端會取回公鑰並實際簽章驗證，通過才登錄（不提供上傳私鑰）</summary>
    [HttpPost("keys")]
    public async Task<IActionResult> RegisterKey([FromBody] RegisterSigningKeyRequest request, CancellationToken ct)
        => From(await _licenses.RegisterSigningKeyAsync(request, Actor, ClientIp, ct));

    [HttpPut("keys/{kid}")]
    public async Task<IActionResult> UpdateKey(string kid, [FromBody] UpdateSigningKeyRequest request, CancellationToken ct)
        => From(await _licenses.UpdateSigningKeyAsync(kid, request, Actor, ClientIp, ct));

    // ---------- 設定 ----------

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct) => Ok(await _licenses.GetSettingsAsync(ct));

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] LicenseSettingsDto settings, CancellationToken ct)
        => From(await _licenses.UpdateSettingsAsync(settings, Actor, ClientIp, ct));
}
