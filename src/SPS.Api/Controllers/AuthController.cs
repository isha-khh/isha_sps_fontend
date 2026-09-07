using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 認證控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("認證控制器")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICaptchaService _captchaService;
    private readonly IFido2Service _fido2Service;
    private readonly ISystemSettingService _settingService;
    private readonly IActionLogService _actionLogService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ICaptchaService captchaService,
        IFido2Service fido2Service,
        ISystemSettingService settingService,
        IActionLogService actionLogService,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _captchaService = captchaService;
        _fido2Service = fido2Service;
        _settingService = settingService;
        _actionLogService = actionLogService;
        _configuration = configuration;
        _logger = logger;
    }

    private async Task<bool> IsFido2EnabledAsync()
    {
        var result = await _settingService.GetSettingAsync<Fido2SettingsDto>("Fido2");
        return result.IsSuccess && (result.Data?.EnableForMember ?? false);
    }

    /// <summary>
    /// 取得密碼策略（公開）
    /// </summary>
    [HttpGet("password-policy")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PasswordPolicyDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPasswordPolicy()
    {
        var result = await _settingService.GetSettingAsync<PasswordPolicyDto>("PasswordPolicy");
        return Ok(result.Data ?? new PasswordPolicyDto());
    }

    /// <summary>
    /// 取得 FIDO2 Passkey 啟用狀態（公開）
    /// </summary>
    [HttpGet("fido2/status")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFido2Status()
    {
        return Ok(new { enabled = await IsFido2EnabledAsync() });
    }

    /// <summary>
    /// 會員登入
    /// </summary>
    /// <param name="request">登入請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>會員資訊（Token 設置在 HttpOnly Cookie 中）</returns>
    /// <response code="200">登入成功，返回會員資訊</response>
    /// <response code="400">登入失敗，帳號或密碼錯誤</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MemberInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // 取得客戶端 IP 地址（支援反向代理）
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        // 驗證 CAPTCHA
        if (await _captchaService.IsScenarioEnabledAsync("member-login", cancellationToken))
        {
            var captchaResult = await _captchaService.VerifyCaptchaAsync(request.Captcha, ipAddress, cancellationToken);
            if (!captchaResult.IsSuccess)
            {
                return BadRequest(new { error = captchaResult.Error });
            }
        }

        var result = await _authService.LoginAsync(request, ipAddress, userAgent, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var tokenResponse = result.Data;

        // 檢查必要的數據
        if (string.IsNullOrEmpty(tokenResponse?.RefreshToken))
        {
            _logger.LogError("RefreshToken is null or empty after login");
            return StatusCode(500, new { error = "Login succeeded but token generation failed" });
        }

        if (tokenResponse.Member == null)
        {
            _logger.LogError("Member info is null after login");
            return StatusCode(500, new { error = "Login succeeded but member info is missing" });
        }

        // 設置 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken, tokenResponse.ExpiresAt, cancellationToken);

        _logger.LogInformation("Login successful for user: {Email}, Cookies set", request.Email);

        // 返回會員資訊及密碼變更狀態
        return Ok(new
        {
            member = tokenResponse.Member,
            requirePasswordChange = tokenResponse.RequirePasswordChange,
            passwordChangeReason = tokenResponse.PasswordChangeReason
        });
    }

    /// <summary>
    /// 設置認證 Cookie（從 DB 讀取安全設定）
    /// </summary>
    private async Task SetAuthCookiesAsync(string accessToken, string refreshToken, DateTime expiresAt, CancellationToken cancellationToken = default)
    {
        var isProduction = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development";

        // 從 DB 讀取 Cookie 安全設定
        var httpSecurityResult = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity", cancellationToken);
        var cookieSettings = httpSecurityResult.Data?.Cookie ?? new CookieSecuritySettingsDto();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = cookieSettings.HttpOnly,
            Secure = isProduction && cookieSettings.Secure,
            SameSite = ParseSameSite(cookieSettings.SameSite),
            Path = "/",
            Domain = null
        };

        _logger.LogInformation("Setting auth cookies - Secure: {Secure}, SameSite: {SameSite}, ExpiresAt: {ExpiresAt}",
            cookieOptions.Secure, cookieOptions.SameSite, expiresAt);

        // 設置 Access Token Cookie
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = cookieOptions.HttpOnly,
            Secure = cookieOptions.Secure,
            SameSite = cookieOptions.SameSite,
            Path = cookieOptions.Path,
            Domain = cookieOptions.Domain,
            Expires = expiresAt
        };
        Response.Cookies.Append("accessToken", accessToken, accessTokenOptions);
        _logger.LogInformation("Access token cookie appended");

        // 設置 Refresh Token Cookie（依 DB 設定的天數）
        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = cookieOptions.HttpOnly,
            Secure = cookieOptions.Secure,
            SameSite = cookieOptions.SameSite,
            Path = cookieOptions.Path,
            Domain = cookieOptions.Domain,
            Expires = DateTimeOffset.UtcNow.AddDays(cookieSettings.RefreshTokenExpiryDays)
        };
        Response.Cookies.Append("refreshToken", refreshToken, refreshTokenOptions);
        _logger.LogInformation("Refresh token cookie appended");
    }

    private static SameSiteMode ParseSameSite(string? sameSite) =>
        (sameSite ?? "Lax").ToLower() switch
        {
            "strict" => SameSiteMode.Strict,
            "none" => SameSiteMode.None,
            _ => SameSiteMode.Lax
        };

    /// <summary>
    /// 會員注冊
    /// </summary>
    /// <param name="request">注冊請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>會員資訊（Token 設置在 HttpOnly Cookie 中）</returns>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MemberInfo), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

        // 驗證 CAPTCHA
        if (await _captchaService.IsScenarioEnabledAsync("member-register", cancellationToken))
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            var captchaResult = await _captchaService.VerifyCaptchaAsync(request.Captcha, remoteIp, cancellationToken);
            if (!captchaResult.IsSuccess)
            {
                return BadRequest(new { error = captchaResult.Error });
            }
        }

        var result = await _authService.RegisterAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var tokenResponse = result.Data!;

        // 設置 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken!, tokenResponse.ExpiresAt, cancellationToken);

        // 只返回會員資訊，不包含 token
        return CreatedAtAction(nameof(GetProfile), tokenResponse.Member);
    }

    /// <summary>
    /// 獲取當前會員信息
    /// </summary>
    /// <returns>會員信息</returns>
    /// <response code="200">成功返回會員信息</response>
    /// <response code="401">未授權，Token無效或已過期</response>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(MemberInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetProfile()
    {
        var memberId = User.FindFirst("MemberId")?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var companyId = User.FindFirst("CompanyId")?.Value;
        var companyName = User.FindFirst("CompanyName")?.Value;

        if (string.IsNullOrEmpty(memberId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var memberInfo = new MemberInfo
        {
            Id = Guid.Parse(memberId),
            Email = email ?? string.Empty,
            Name = name ?? string.Empty,
            CompanyId = !string.IsNullOrEmpty(companyId) ? Guid.Parse(companyId) : null,
            CompanyName = companyName
        };

        return Ok(memberInfo);
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>會員資訊（新的 Token 設置在 HttpOnly Cookie 中）</returns>
    /// <response code="200">刷新成功，返回會員資訊</response>
    /// <response code="400">刷新失敗，RefreshToken無效或已過期</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MemberInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        // 從 Cookie 中讀取 RefreshToken
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
        {
            return BadRequest(new { error = "Refresh token not found in cookie" });
        }

        var result = await _authService.RefreshTokenAsync(refreshToken, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var tokenResponse = result.Data!;

        // 設置新的 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken!, tokenResponse.ExpiresAt, cancellationToken);

        // 只返回會員資訊，不包含 token
        return Ok(tokenResponse.Member);
    }

    /// <summary>
    /// 登出
    /// </summary>
    /// <returns>登出成功訊息</returns>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        // 取得使用者資訊（從 JWT Token）
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "未知使用者";

        // 取得客戶端 IP 地址
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        // 記錄登出
        if (!string.IsNullOrEmpty(userId))
        {
            await _actionLogService.LogLogoutAsync(userId, userName, "前台系統", ipAddress, userAgent);
        }

        // 清除 Cookie
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");

        return Ok(new { message = "Logout successful" });
    }

    /// <summary>
    /// 測試認證端點
    /// </summary>
    [HttpGet("test")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "認證成功",
            user = User.Identity?.Name,
            claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    /// <param name="request">發送驗證碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">驗證碼已發送</response>
    /// <response code="400">發送失敗</response>
    [HttpPost("send-verification-code")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendVerificationCode(
        [FromBody] SendVerificationCodeRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Send verification code request for email: {Email}", request.Email);

        var result = await _authService.SendVerificationCodeAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "驗證碼已發送至您的郵箱" });
    }

    /// <summary>
    /// 修改密碼
    /// </summary>
    /// <param name="request">修改密碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">密碼修改成功</response>
    /// <response code="400">密碼修改失敗</response>
    [HttpPost("change-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] MemberChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Change password request for email: {Email}", request.Email);

        var result = await _authService.ChangePasswordAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "密碼已成功修改" });
    }

    /// <summary>
    /// 忘記密碼 - 發送重置密碼郵件
    /// </summary>
    /// <param name="request">忘記密碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">重置密碼郵件已發送</response>
    /// <response code="400">發送失敗</response>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Forgot password request for email: {Email}", request.Email);

        var result = await _authService.ForgotPasswordAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "重置密碼郵件已發送至您的信箱" });
    }

    /// <summary>
    /// 重置密碼 - 透過 Token 設定新密碼
    /// </summary>
    /// <param name="request">重置密碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">密碼重置成功</response>
    /// <response code="400">重置失敗</response>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] MemberResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Reset password request");

        // 取得客戶端 IP 地址
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        var result = await _authService.ResetPasswordAsync(request, ipAddress, userAgent, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "密碼已成功重置" });
    }

    /// <summary>
    /// 驗證重置密碼 Token
    /// </summary>
    /// <param name="token">重置密碼 Token</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    /// <response code="200">Token 有效</response>
    /// <response code="400">Token 無效或已過期</response>
    [HttpGet("validate-reset-token")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateResetToken(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Validate reset token request");

        var result = await _authService.ValidateResetTokenAsync(token, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { email = result.Data, valid = true });
    }

    #region FIDO2 WebAuthn

    /// <summary>
    /// 開始 FIDO2 安全金鑰註冊
    /// </summary>
    [HttpPost("fido2/register/start")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fido2RegisterStart(
        [FromQuery] string? deviceName,
        CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        var memberId = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(memberId) || !Guid.TryParse(memberId, out var id))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.StartRegistrationAsync("Member", id, deviceName, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 完成 FIDO2 安全金鑰註冊
    /// </summary>
    [HttpPost("fido2/register/complete")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fido2RegisterComplete(
        [FromBody] Fido2RegisterCompleteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        var memberId = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(memberId) || !Guid.TryParse(memberId, out var id))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.CompleteRegistrationAsync("Member", id, request.AttestationResponse, request.DeviceName, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "安全金鑰註冊成功" });
    }

    /// <summary>
    /// 開始 FIDO2 安全金鑰認證
    /// </summary>
    [HttpPost("fido2/authenticate/start")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fido2AuthenticateStart(
        [FromBody] Fido2AuthenticateStartRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        var result = await _fido2Service.StartAuthenticationAsync("Member", request.Email, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 完成 FIDO2 安全金鑰認證
    /// </summary>
    [HttpPost("fido2/authenticate/complete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MemberInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fido2AuthenticateComplete(
        [FromBody] Fido2AuthenticateCompleteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        // 取得客戶端 IP 地址
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        var result = await _fido2Service.CompleteMemberAuthenticationAsync(request.AssertionResponse, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        var tokenResponse = result.Data!;

        // 記錄 Fido2 登入成功
        await _actionLogService.LogLoginAsync(
            userId: tokenResponse.Member!.Id.ToString(),
            userName: tokenResponse.Member.Name ?? tokenResponse.Member.Email,
            userType: "前台系統",
            isSuccess: true,
            loginMethod: "Fido2",
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken!, tokenResponse.ExpiresAt, cancellationToken);

        return Ok(new
        {
            member = tokenResponse.Member,
            requirePasswordChange = tokenResponse.RequirePasswordChange,
            passwordChangeReason = tokenResponse.PasswordChangeReason
        });
    }

    /// <summary>
    /// 列出我的 FIDO2 安全金鑰
    /// </summary>
    [HttpGet("fido2/credentials")]
    [Authorize]
    [ProducesResponseType(typeof(List<Fido2CredentialInfo>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Fido2GetCredentials(CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        var memberId = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(memberId) || !Guid.TryParse(memberId, out var id))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.GetCredentialsAsync("Member", id, cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// 刪除 FIDO2 安全金鑰
    /// </summary>
    [HttpDelete("fido2/credentials/{credentialId}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fido2DeleteCredential(
        Guid credentialId,
        CancellationToken cancellationToken)
    {
        if (!await IsFido2EnabledAsync())
            return BadRequest(new { error = "FIDO2 功能未啟用" });

        var memberId = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(memberId) || !Guid.TryParse(memberId, out var id))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.DeleteCredentialAsync(credentialId, "Member", id, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "安全金鑰已刪除" });
    }

    #endregion
}