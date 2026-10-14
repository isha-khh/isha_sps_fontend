using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Services;
using SPS.Application.DTOs.License;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services.Licensing;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 軟體授權 API（給廠商的 XR 軟體呼叫）。匿名端點（桌面軟體沒有登入 cookie）：身分由序號（啟用）或授權檔（續期、停用）證明。
/// 欄位名稱與錯誤代碼是對外規格，見 docs/xr-license/。回應一律不快取。
/// </summary>
[ApiController]
[Route("api/license/v1")]
[AllowAnonymous]
[Produces("application/json")]
[SwaggerTag("軟體授權 API（XR）")]
public class LicenseApiController : ControllerBase
{
    private readonly ILicenseService _licenses;
    private readonly LicenseRateLimiter _limiter;

    public LicenseApiController(ILicenseService licenses, LicenseRateLimiter limiter)
    {
        _licenses = licenses;
        _limiter = limiter;
    }

    private string ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private IActionResult Error(string code, string message, int status)
    {
        Response.Headers.CacheControl = "no-store";
        return StatusCode(status, new LicenseErrorResponse { Error = code, Message = message });
    }

    private IActionResult Limited()
    {
        Response.Headers.RetryAfter = "60";
        return Error(LicenseErrors.RateLimited, "請求太頻繁，請稍後再試", StatusCodes.Status429TooManyRequests);
    }

    private IActionResult From<T>(LicenseResult<T> result)
    {
        Response.Headers.CacheControl = "no-store";
        return result.Success ? Ok(result.Data) : Error(result.ErrorCode, result.Message, result.HttpStatus);
    }

    /// <summary>啟用：用序號與裝置指紋換授權檔</summary>
    [HttpPost("activate")]
    [SwaggerOperation(Summary = "啟用（序號＋裝置 → 授權檔）")]
    [ProducesResponseType(typeof(LicenseIssueResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(LicenseErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Activate([FromBody] LicenseActivateRequest request, CancellationToken ct)
    {
        if (!_limiter.AllowRequest(ClientIp)) return Limited();
        if (_limiter.IsIpBlockedForInvalidKeys(ClientIp)) return Limited();

        var normalized = LicenseKeyGenerator.Normalize(request.LicenseKey);
        var keyHash = normalized == null ? null : LicenseCrypto.Sha256Hex(normalized);
        if (keyHash != null && _limiter.IsKeyBlocked(keyHash)) return Limited();

        var result = await _licenses.ActivateAsync(request, ClientIp, ct);
        if (!result.Success)
        {
            if (result.ErrorCode is LicenseErrors.InvalidKey)
            {
                _limiter.RecordInvalidKey(ClientIp);
                await Task.Delay(Random.Shared.Next(250, 600), ct); // 失敗時刻意延遲，拖慢序號枚舉
            }
            else if (keyHash != null && result.ErrorCode != LicenseErrors.ServiceUnavailable && result.ErrorCode != LicenseErrors.InvalidRequest)
            {
                _limiter.RecordKeyFailure(keyHash);
            }
        }
        return From(result);
    }

    /// <summary>續期：用舊授權檔換新的租約</summary>
    [HttpPost("refresh")]
    [SwaggerOperation(Summary = "續期（舊授權檔 → 新授權檔）")]
    [ProducesResponseType(typeof(LicenseIssueResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh([FromBody] LicenseRefreshRequest request, CancellationToken ct)
    {
        if (!_limiter.AllowRequest(ClientIp)) return Limited();
        var result = await _licenses.RefreshAsync(request, ClientIp, ct);
        if (!result.Success && result.ErrorCode == LicenseErrors.InvalidLicense)
            await Task.Delay(Random.Shared.Next(250, 600), ct);
        return From(result);
    }

    /// <summary>停用：釋放這台裝置的席次（客戶換電腦）</summary>
    [HttpPost("deactivate")]
    [SwaggerOperation(Summary = "停用這台裝置（釋放席次）")]
    [ProducesResponseType(typeof(LicenseOkResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Deactivate([FromBody] LicenseDeactivateRequest request, CancellationToken ct)
    {
        if (!_limiter.AllowRequest(ClientIp)) return Limited();
        return From(await _licenses.DeactivateAsync(request, ClientIp, ct));
    }

    /// <summary>簽章公鑰：廠商軟體內嵌（依 kid 選用）；也可用來檢查有沒有新的待命金鑰</summary>
    [HttpGet("public-keys")]
    [SwaggerOperation(Summary = "簽章公鑰清單")]
    [ProducesResponseType(typeof(LicensePublicKeysResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> PublicKeys(CancellationToken ct)
    {
        if (!_limiter.AllowRequest(ClientIp)) return Limited();
        Response.Headers.CacheControl = "public, max-age=300";
        return Ok(await _licenses.GetPublicKeysAsync(ct));
    }
}
