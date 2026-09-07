using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Auth;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 後台管理員認證控制器
/// </summary>
[ApiController]
[Route("api/admin/[controller]")]
[Produces("application/json")]
[SwaggerTag("後台管理員認證控制器")]
public class AdminAuthController : ControllerBase
{
    private readonly IAdminAuthService _adminAuthService;
    private readonly ICaptchaService _captchaService;
    private readonly IFido2Service _fido2Service;
    private readonly ISystemSettingService _settingService;
    private readonly IActionLogService _actionLogService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthController> _logger;

    public AdminAuthController(
        IAdminAuthService adminAuthService,
        ICaptchaService captchaService,
        IFido2Service fido2Service,
        ISystemSettingService settingService,
        IActionLogService actionLogService,
        IConfiguration configuration,
        ILogger<AdminAuthController> logger)
    {
        _adminAuthService = adminAuthService;
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
        return result.IsSuccess && (result.Data?.EnableForAdmin ?? false);
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

    [HttpGet("check-init")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SystemInitResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckInit(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Checking system initialization status");

        var result = await _adminAuthService.CheckInitAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 註冊首個系統管理員
    /// </summary>
    /// <param name="request">註冊請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>管理員資訊（Token 設置在 HttpOnly Cookie 中）</returns>
    /// <response code="201">註冊成功，返回管理員資訊</response>
    /// <response code="400">註冊失敗，系統已初始化或參數錯誤</response>
    [HttpPost("register-first-admin")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterFirstAdmin(
        [FromBody] AdminRegisterRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Register first admin attempt for account: {Account}", request.Account);

        var result = await _adminAuthService.RegisterFirstAdminAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var tokenResponse = result.Data;

        // 檢查必要的數據
        if (string.IsNullOrEmpty(tokenResponse?.RefreshToken))
        {
            _logger.LogError("RefreshToken is null or empty after registration");
            return StatusCode(500, new { error = "Registration succeeded but token generation failed" });
        }

        if (tokenResponse.User == null)
        {
            _logger.LogError("User info is null after registration");
            return StatusCode(500, new { error = "Registration succeeded but user info is missing" });
        }

        // 設置 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken, tokenResponse.ExpiresAt, cancellationToken);

        _logger.LogInformation("First admin registered successfully: {UserId}", tokenResponse.User.Id);

        // 只返回管理員資訊，不包含 token
        return CreatedAtAction(nameof(GetProfile), tokenResponse.User);
    }

    /// <summary>
    /// 後台管理員登入
    /// </summary>
    /// <param name="request">登入請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>管理員資訊（Token 設置在 HttpOnly Cookie 中）</returns>
    /// <response code="200">登入成功，返回管理員資訊</response>
    /// <response code="400">登入失敗，帳號或密碼錯誤</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] AdminLoginRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Admin login attempt for account: {Email}", request.Email);

        // 取得客戶端 IP 地址（支援反向代理）
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        // 驗證 CAPTCHA
        if (await _captchaService.IsScenarioEnabledAsync("admin-login", cancellationToken))
        {
            var captchaResult = await _captchaService.VerifyCaptchaAsync(request.Captcha, ipAddress, cancellationToken);
            if (!captchaResult.IsSuccess)
            {
                return BadRequest(new { error = captchaResult.Error });
            }
        }

        var result = await _adminAuthService.LoginAsync(request, ipAddress, userAgent, cancellationToken);

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

        if (tokenResponse.User == null)
        {
            _logger.LogError("User info is null after login");
            return StatusCode(500, new { error = "Login succeeded but user info is missing" });
        }

        // 設置 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken, tokenResponse.ExpiresAt, cancellationToken);

        _logger.LogInformation("Admin login successful for user: {Email}, Cookies set", request.Email);

        // 只返回管理員資訊，不包含 token
        return Ok(tokenResponse.User);
    }

    /// <summary>
    /// 獲取當前管理員信息
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>管理員信息</returns>
    /// <response code="200">成功返回管理員信息</response>
    /// <response code="401">未授權，Token無效或已過期</response>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var result = await _adminAuthService.GetProfileAsync(userId, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 更新個人資料
    /// </summary>
    /// <param name="request">更新個人資料請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的管理員信息</returns>
    /// <response code="200">更新成功</response>
    /// <response code="400">更新失敗</response>
    /// <response code="401">未授權</response>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        _logger.LogInformation("Update profile request for user: {UserId}", userId);

        var result = await _adminAuthService.UpdateProfileAsync(userId, request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 更新頭像
    /// </summary>
    /// <param name="request">更新頭像請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新後的管理員信息</returns>
    /// <response code="200">更新成功</response>
    /// <response code="400">更新失敗</response>
    /// <response code="401">未授權</response>
    [HttpPut("avatar")]
    [Authorize]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAvatar(
        [FromBody] UpdateAvatarRequest request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        _logger.LogInformation("Update avatar request for user: {UserId}, FileId: {FileId}", userId, request.FileId);

        var result = await _adminAuthService.UpdateAvatarAsync(userId, request.FileId, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>管理員資訊（新的 Token 設置在 HttpOnly Cookie 中）</returns>
    /// <response code="200">刷新成功，返回管理員資訊</response>
    /// <response code="400">刷新失敗，RefreshToken無效或已過期</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        // 從 Cookie 中讀取 RefreshToken
        if (!Request.Cookies.TryGetValue("adminRefreshToken", out var refreshToken))
        {
            return BadRequest(new { error = "Refresh token not found in cookie" });
        }

        var result = await _adminAuthService.RefreshTokenAsync(refreshToken, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var tokenResponse = result.Data!;

        // 設置新的 HttpOnly Cookie
        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken!, tokenResponse.ExpiresAt, cancellationToken);

        // 只返回管理員資訊，不包含 token
        return Ok(tokenResponse.User);
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
            await _actionLogService.LogLogoutAsync(userId, userName, "後台系統", ipAddress, userAgent);
        }

        // 清除 Cookie
        Response.Cookies.Delete("adminAccessToken");
        Response.Cookies.Delete("adminRefreshToken");

        return Ok(new { message = "Logout successful" });
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

        _logger.LogInformation("Setting admin auth cookies - Secure: {Secure}, SameSite: {SameSite}, ExpiresAt: {ExpiresAt}",
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
        Response.Cookies.Append("adminAccessToken", accessToken, accessTokenOptions);
        _logger.LogInformation("Admin access token cookie appended");

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
        Response.Cookies.Append("adminRefreshToken", refreshToken, refreshTokenOptions);
        _logger.LogInformation("Admin refresh token cookie appended");
    }

    private static SameSiteMode ParseSameSite(string? sameSite) =>
        (sameSite ?? "Lax").ToLower() switch
        {
            "strict" => SameSiteMode.Strict,
            "none" => SameSiteMode.None,
            _ => SameSiteMode.Lax
        };

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
            message = "後台認證成功",
            user = User.Identity?.Name,
            claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    /// <summary>
    /// 修改密碼
    /// </summary>
    /// <param name="request">修改密碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">密碼修改成功</response>
    /// <response code="400">密碼修改失敗</response>
    /// <response code="401">未授權</response>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        _logger.LogInformation("Password change request for user: {UserId}", userId);

        var result = await _adminAuthService.ChangePasswordAsync(userId, request, cancellationToken);

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
    /// <response code="200">郵件發送成功（無論帳號是否存在都返回成功）</response>
    /// <response code="400">請求失敗</response>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Forgot password request for email: {Email}", request.Email);

        // 驗證 CAPTCHA
        if (await _captchaService.IsScenarioEnabledAsync("forgot-password", cancellationToken))
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            var captchaResult = await _captchaService.VerifyCaptchaAsync(request.Captcha, remoteIp, cancellationToken);
            if (!captchaResult.IsSuccess)
            {
                return BadRequest(new { error = captchaResult.Error });
            }
        }

        var result = await _adminAuthService.ForgotPasswordAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "如果此信箱已註冊，您將收到重置密碼的郵件" });
    }

    /// <summary>
    /// 重置密碼 - 透過 Token 設定新密碼
    /// </summary>
    /// <param name="request">重置密碼請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    /// <response code="200">密碼重置成功</response>
    /// <response code="400">重置失敗（Token 無效或已過期）</response>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] AdminResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Reset password attempt");

        // 取得客戶端 IP 地址
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault();

        var result = await _adminAuthService.ResetPasswordAsync(request, ipAddress, userAgent, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = "密碼已成功重置，請使用新密碼登入" });
    }

    /// <summary>
    /// 驗證重置密碼 Token 是否有效
    /// </summary>
    /// <param name="token">重置密碼 Token</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>Token 是否有效及使用者郵箱</returns>
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
        _logger.LogInformation("Validating reset token");

        var result = await _adminAuthService.ValidateResetTokenAsync(token, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { valid = true, email = result.Data });
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

        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.StartRegistrationAsync("User", userId, deviceName, cancellationToken);
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

        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.CompleteRegistrationAsync("User", userId, request.AttestationResponse, request.DeviceName, cancellationToken);
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

        var result = await _fido2Service.StartAuthenticationAsync("User", request.Email, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// 完成 FIDO2 安全金鑰認證
    /// </summary>
    [HttpPost("fido2/authenticate/complete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminUserInfo), StatusCodes.Status200OK)]
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

        var result = await _fido2Service.CompleteUserAuthenticationAsync(request.AssertionResponse, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        var tokenResponse = result.Data!;

        // 記錄 Fido2 登入成功
        await _actionLogService.LogLoginAsync(
            userId: tokenResponse.User!.Id.ToString(),
            userName: tokenResponse.User.Name ?? tokenResponse.User.Account,
            userType: "後台系統",
            isSuccess: true,
            loginMethod: "Fido2",
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        await SetAuthCookiesAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken!, tokenResponse.ExpiresAt, cancellationToken);

        return Ok(tokenResponse.User);
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

        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.GetCredentialsAsync("User", userId, cancellationToken);
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

        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token" });

        var result = await _fido2Service.DeleteCredentialAsync(credentialId, "User", userId, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "安全金鑰已刪除" });
    }

    #endregion
}
