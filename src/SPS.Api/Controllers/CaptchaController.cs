using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Captcha;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// CAPTCHA 驗證碼控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("CAPTCHA 驗證碼控制器")]
public class CaptchaController : ControllerBase
{
    private readonly ICaptchaService _captchaService;
    private readonly ILogger<CaptchaController> _logger;

    public CaptchaController(
        ICaptchaService captchaService,
        ILogger<CaptchaController> logger)
    {
        _captchaService = captchaService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取指定場景的 CAPTCHA 設定
    /// </summary>
    /// <param name="scenario">場景名稱（member-login, member-register, admin-login, forgot-password）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>公開的 CAPTCHA 設定</returns>
    /// <response code="200">成功返回設定</response>
    [HttpGet("settings")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CaptchaPublicSettings), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(
        [FromQuery] string scenario,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Get CAPTCHA settings for scenario: {Scenario}", scenario);

        var result = await _captchaService.GetPublicSettingsAsync(scenario, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 生成圖片驗證碼
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證碼資訊</returns>
    /// <response code="200">成功生成驗證碼</response>
    /// <response code="400">生成失敗</response>
    [HttpPost("generate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CaptchaGenerateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Generate image captcha request");

        var result = await _captchaService.GenerateImageCaptchaAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取音訊驗證碼
    /// </summary>
    /// <param name="captchaId">驗證碼 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>WAV 格式音訊</returns>
    /// <response code="200">成功返回音訊</response>
    /// <response code="400">獲取失敗</response>
    /// <response code="404">驗證碼不存在</response>
    [HttpGet("audio/{captchaId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAudio(
        string captchaId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Get audio captcha for ID: {CaptchaId}", captchaId);

        var result = await _captchaService.GetCaptchaAudioAsync(captchaId, cancellationToken);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("不存在") == true || result.Error?.Contains("過期") == true)
            {
                return NotFound(new { error = result.Error });
            }
            return BadRequest(new { error = result.Error });
        }

        return File(result.Data!, "audio/wav", "captcha.wav");
    }

    /// <summary>
    /// 驗證 CAPTCHA
    /// </summary>
    /// <param name="request">驗證請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    /// <response code="200">驗證成功</response>
    /// <response code="400">驗證失敗</response>
    [HttpPost("verify")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify(
        [FromBody] CaptchaVerifyRequest request,
        CancellationToken cancellationToken)
    {
        var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        _logger.LogInformation("Verify captcha request from IP: {RemoteIp}", remoteIp);

        var result = await _captchaService.VerifyCaptchaAsync(request, remoteIp, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { success = true, message = "驗證成功" });
    }
}
