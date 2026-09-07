using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 系統設定控制器
/// </summary>
[ApiController]
[Route("api/settings")]
[Authorize(Roles = "SuperAdmin,SettingsAdmin")]
[Produces("application/json")]
[SwaggerTag("系統設定控制器")]
public class SystemSettingController : ControllerBase
{
    private readonly ISystemSettingService _settingService;
    private readonly IEmailService _emailService;
    private readonly IHttpSecuritySettingsProvider _httpSecuritySettingsProvider;
    private readonly IFido2Provider _fido2Provider;
    private readonly Infrastructure.Services.NginxReloadService _nginxReloadService;
    private readonly IProTrackService _proTrackService;
    private readonly IEmbeddingService _embeddingService;

    public SystemSettingController(
        ISystemSettingService settingService,
        IEmailService emailService,
        IHttpSecuritySettingsProvider httpSecuritySettingsProvider,
        IFido2Provider fido2Provider,
        Infrastructure.Services.NginxReloadService nginxReloadService,
        IProTrackService proTrackService,
        IEmbeddingService embeddingService)
    {
        _settingService = settingService;
        _emailService = emailService;
        _httpSecuritySettingsProvider = httpSecuritySettingsProvider;
        _fido2Provider = fido2Provider;
        _nginxReloadService = nginxReloadService;
        _proTrackService = proTrackService;
        _embeddingService = embeddingService;
    }

    /// <summary>
    /// 獲取 Email 設定
    /// </summary>
    [HttpGet("email")]
    [SwaggerOperation(Summary = "獲取 Email 設定")]
    public async Task<IActionResult> GetEmailSettings()
    {
        var result = await _settingService.GetSettingAsync<EmailSettingsDto>("Email");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新 Email 設定
    /// </summary>
    [HttpPut("email")]
    [SwaggerOperation(Summary = "更新 Email 設定")]
    public async Task<IActionResult> UpdateEmailSettings([FromBody] EmailSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("Email", settings);
        return result.IsSuccess ? Ok(new { message = "Email settings updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 獲取 Google Analytics 設定
    /// </summary>
    [HttpGet("google-analytics")]
    [SwaggerOperation(Summary = "獲取 Google Analytics 設定")]
    public async Task<IActionResult> GetGoogleAnalyticsSettings()
    {
        var result = await _settingService.GetSettingAsync<GoogleAnalyticsSettingsDto>("GoogleAnalytics");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新 Google Analytics 設定
    /// </summary>
    [HttpPut("google-analytics")]
    [SwaggerOperation(Summary = "更新 Google Analytics 設定")]
    public async Task<IActionResult> UpdateGoogleAnalyticsSettings([FromBody] GoogleAnalyticsSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("GoogleAnalytics", settings);
        return result.IsSuccess ? Ok(new { message = "Google Analytics settings updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 獲取檔案存儲設定
    /// </summary>
    [HttpGet("file-storage")]
    [SwaggerOperation(Summary = "獲取檔案存儲設定")]
    public async Task<IActionResult> GetFileStorageSettings()
    {
        var result = await _settingService.GetSettingAsync<FileStorageSettingsDto>("FileStorage");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新檔案存儲設定
    /// </summary>
    [HttpPut("file-storage")]
    [SwaggerOperation(Summary = "更新檔案存儲設定")]
    public async Task<IActionResult> UpdateFileStorageSettings([FromBody] FileStorageSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("FileStorage", settings);
        return result.IsSuccess ? Ok(new { message = "File storage settings updated" }) : BadRequest(new { error = result.Error });
    }

    // ==================== 安全性設定 ====================

    /// <summary>
    /// 獲取安全性設定
    /// </summary>
    [HttpGet("security")]
    [SwaggerOperation(Summary = "獲取安全性設定")]
    public async Task<IActionResult> GetSecuritySettings()
    {
        var result = await _settingService.GetSettingAsync<SecuritySettingsDto>("Security");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新安全性設定
    /// </summary>
    [HttpPut("security")]
    [SwaggerOperation(Summary = "更新安全性設定")]
    public async Task<IActionResult> UpdateSecuritySettings([FromBody] SecuritySettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("Security", settings);
        return result.IsSuccess ? Ok(new { message = "Security settings updated" }) : BadRequest(new { error = result.Error });
    }

    // ==================== 內容設定 ====================

    /// <summary>
    /// 獲取內容設定（管理員）
    /// </summary>
    [HttpGet("content")]
    [SwaggerOperation(Summary = "獲取內容設定")]
    public async Task<IActionResult> GetContentSettings()
    {
        var result = await _settingService.GetSettingAsync<ContentSettingsDto>("Content");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新內容設定
    /// </summary>
    [HttpPut("content")]
    [SwaggerOperation(Summary = "更新內容設定")]
    public async Task<IActionResult> UpdateContentSettings([FromBody] ContentSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("Content", settings);
        return result.IsSuccess ? Ok(new { message = "Content settings updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 獲取內容設定（公開，前台使用）
    /// </summary>
    [HttpGet("content/public")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "獲取內容設定（公開）")]
    public async Task<IActionResult> GetContentSettingsPublic()
    {
        var result = await _settingService.GetSettingAsync<ContentSettingsDto>("Content");
        return result.IsSuccess ? Ok(result.Data) : Ok(new ContentSettingsDto());
    }

    // ==================== 會員申請須知設定 ====================

    /// <summary>
    /// 獲取會員申請須知設定（管理員）
    /// </summary>
    [HttpGet("membership-guide")]
    [SwaggerOperation(Summary = "獲取會員申請須知設定")]
    public async Task<IActionResult> GetMembershipGuideSettings()
    {
        var result = await _settingService.GetSettingAsync<MembershipGuideSettingsDto>("MembershipGuide");
        return result.IsSuccess ? Ok(result.Data ?? new MembershipGuideSettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新會員申請須知設定
    /// </summary>
    [HttpPut("membership-guide")]
    [SwaggerOperation(Summary = "更新會員申請須知設定")]
    public async Task<IActionResult> UpdateMembershipGuideSettings([FromBody] MembershipGuideSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("MembershipGuide", settings);
        return result.IsSuccess ? Ok(new { message = "Membership guide settings updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 獲取會員申請須知設定（公開，前台使用）
    /// </summary>
    [HttpGet("membership-guide/public")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "獲取會員申請須知設定（公開）")]
    public async Task<IActionResult> GetMembershipGuideSettingsPublic()
    {
        var result = await _settingService.GetSettingAsync<MembershipGuideSettingsDto>("MembershipGuide");
        return result.IsSuccess ? Ok(result.Data ?? new MembershipGuideSettingsDto()) : Ok(new MembershipGuideSettingsDto());
    }

    // ==================== CAPTCHA 設定 ====================

    /// <summary>
    /// 獲取 CAPTCHA 設定
    /// </summary>
    [HttpGet("captcha")]
    [SwaggerOperation(Summary = "獲取 CAPTCHA 設定")]
    public async Task<IActionResult> GetCaptchaSettings()
    {
        var result = await _settingService.GetSettingAsync<CaptchaSettingsDto>("Captcha");
        return result.IsSuccess ? Ok(result.Data ?? new CaptchaSettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新 CAPTCHA 設定
    /// </summary>
    [HttpPut("captcha")]
    [SwaggerOperation(Summary = "更新 CAPTCHA 設定")]
    public async Task<IActionResult> UpdateCaptchaSettings([FromBody] CaptchaSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("Captcha", settings);
        return result.IsSuccess ? Ok(new { message = "CAPTCHA settings updated" }) : BadRequest(new { error = result.Error });
    }

    // ==================== 密碼策略設定 ====================

    /// <summary>
    /// 獲取密碼策略設定
    /// </summary>
    [HttpGet("password-policy")]
    [SwaggerOperation(Summary = "獲取密碼策略設定")]
    public async Task<IActionResult> GetPasswordPolicySettings()
    {
        var result = await _settingService.GetSettingAsync<PasswordPolicyDto>("PasswordPolicy");
        return result.IsSuccess ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新密碼策略設定
    /// </summary>
    [HttpPut("password-policy")]
    [SwaggerOperation(Summary = "更新密碼策略設定")]
    public async Task<IActionResult> UpdatePasswordPolicySettings([FromBody] PasswordPolicyDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("PasswordPolicy", settings);
        return result.IsSuccess ? Ok(new { message = "Password policy settings updated" }) : BadRequest(new { error = result.Error });
    }

    // ==================== 郵件版面配置（Layout / Branding） ====================

    /// <summary>
    /// 獲取郵件版面配置
    /// </summary>
    [HttpGet("email-layout")]
    [SwaggerOperation(Summary = "獲取郵件版面配置（Logo、顏色、頁尾等）")]
    public async Task<IActionResult> GetEmailLayoutSettings()
    {
        var result = await _settingService.GetSettingAsync<EmailLayoutSettingsDto>("EmailLayout");
        return result.IsSuccess ? Ok(result.Data ?? new EmailLayoutSettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新郵件版面配置
    /// </summary>
    [HttpPut("email-layout")]
    [SwaggerOperation(Summary = "更新郵件版面配置（Logo、顏色、頁尾等）")]
    public async Task<IActionResult> UpdateEmailLayoutSettings([FromBody] EmailLayoutSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("EmailLayout", settings);
        return result.IsSuccess ? Ok(new { message = "Email layout settings updated" }) : BadRequest(new { error = result.Error });
    }

    // ==================== 信件範本設定 ====================

    /// <summary>
    /// 獲取所有信件範本
    /// </summary>
    [HttpGet("email-templates")]
    [SwaggerOperation(Summary = "獲取所有信件範本")]
    public async Task<IActionResult> GetEmailTemplates()
    {
        var result = await _settingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        // 如果還沒有範本，返回預設範本
        var settings = result.Data ?? new EmailTemplateSettingsDto();
        MergeWithDefaultTemplates(settings.Templates);

        return Ok(settings);
    }

    /// <summary>
    /// 獲取單一信件範本
    /// </summary>
    [HttpGet("email-templates/{key}")]
    [SwaggerOperation(Summary = "獲取單一信件範本")]
    public async Task<IActionResult> GetEmailTemplate(string key)
    {
        var result = await _settingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var settings = result.Data ?? new EmailTemplateSettingsDto();
        MergeWithDefaultTemplates(settings.Templates);

        var template = settings.Templates.FirstOrDefault(t => t.Key == key);
        if (template == null)
        {
            return NotFound(new { error = $"Template with key '{key}' not found" });
        }

        return Ok(template);
    }

    /// <summary>
    /// 更新單一信件範本
    /// </summary>
    [HttpPut("email-templates/{key}")]
    [SwaggerOperation(Summary = "更新單一信件範本")]
    public async Task<IActionResult> UpdateEmailTemplate(string key, [FromBody] EmailTemplate template)
    {
        var result = await _settingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var settings = result.Data ?? new EmailTemplateSettingsDto();
        MergeWithDefaultTemplates(settings.Templates);

        var existingTemplateIndex = settings.Templates.FindIndex(t => t.Key == key);
        if (existingTemplateIndex == -1)
        {
            return NotFound(new { error = $"Template with key '{key}' not found" });
        }

        // 保留 key 和 AvailableVariables
        template.Key = key;
        template.AvailableVariables = settings.Templates[existingTemplateIndex].AvailableVariables;
        settings.Templates[existingTemplateIndex] = template;

        var updateResult = await _settingService.UpdateSettingAsync("EmailTemplates", settings);
        return updateResult.IsSuccess
            ? Ok(new { message = "Email template updated" })
            : BadRequest(new { error = updateResult.Error });
    }

    /// <summary>
    /// 預覽信件範本
    /// </summary>
    [HttpPost("email-templates/{key}/preview")]
    [SwaggerOperation(Summary = "預覽信件範本")]
    public async Task<IActionResult> PreviewEmailTemplate(string key, [FromBody] EmailTemplatePreviewRequest request)
    {
        var result = await _settingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var settings = result.Data ?? new EmailTemplateSettingsDto();
        MergeWithDefaultTemplates(settings.Templates);

        var template = settings.Templates.FirstOrDefault(t => t.Key == key);
        if (template == null)
        {
            return NotFound(new { error = $"Template with key '{key}' not found" });
        }

        var subject = template.Subject;
        var htmlContent = template.HtmlContent;

        foreach (var (variableKey, value) in request.Variables)
        {
            subject = subject.Replace($"{{{{{variableKey}}}}}", value);
            htmlContent = htmlContent.Replace($"{{{{{variableKey}}}}}", value);
        }

        // 取得 base URL 供預覽時使用（將相對路徑轉為完整 URL）
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var wrappedHtml = await _emailService.WrapWithLayoutForPreviewAsync(subject, htmlContent, baseUrl);

        return Ok(new EmailTemplatePreviewResponse
        {
            Subject = subject,
            HtmlContent = wrappedHtml
        });
    }

    /// <summary>
    /// 發送測試郵件
    /// </summary>
    [HttpPost("email-templates/{key}/test")]
    [SwaggerOperation(Summary = "發送測試郵件")]
    public async Task<IActionResult> TestEmailTemplate(string key, [FromBody] EmailTemplateTestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ToEmail))
        {
            return BadRequest(new { error = "Recipient email is required" });
        }

        var result = await _settingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        var settings = result.Data ?? new EmailTemplateSettingsDto();
        MergeWithDefaultTemplates(settings.Templates);

        var template = settings.Templates.FirstOrDefault(t => t.Key == key);
        if (template == null)
        {
            return NotFound(new { error = $"Template with key '{key}' not found" });
        }

        var subject = template.Subject;
        var htmlContent = template.HtmlContent;

        foreach (var (variableKey, value) in request.Variables)
        {
            subject = subject.Replace($"{{{{{variableKey}}}}}", value);
            htmlContent = htmlContent.Replace($"{{{{{variableKey}}}}}", value);
        }

        try
        {
            var (wrappedHtml, resources) = await _emailService.WrapWithLayoutAsync(subject, htmlContent);

            await _emailService.SendEmailAsync(new EmailOption
            {
                To = request.ToEmail,
                Subject = $"[測試] {subject}",
                Body = wrappedHtml,
                LinkedResources = resources
            });

            return Ok(new { message = "Test email sent successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Failed to send test email: {ex.Message}" });
        }
    }

    // ==================== FIDO2 Passkey 設定 ====================

    /// <summary>
    /// 獲取 FIDO2 Passkey 設定
    /// </summary>
    [HttpGet("fido2")]
    [SwaggerOperation(Summary = "獲取 FIDO2 Passkey 開關設定")]
    public async Task<IActionResult> GetFido2Settings()
    {
        var result = await _settingService.GetSettingAsync<Fido2SettingsDto>("Fido2");
        return result.IsSuccess ? Ok(result.Data ?? new Fido2SettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新 FIDO2 Passkey 設定
    /// </summary>
    [HttpPut("fido2")]
    [SwaggerOperation(Summary = "更新 FIDO2 Passkey 設定（含伺服器配置）")]
    public async Task<IActionResult> UpdateFido2Settings([FromBody] Fido2SettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("Fido2", settings);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // 清除快取，下次請求時使用新設定
        _fido2Provider.InvalidateCache();

        return Ok(new { message = "FIDO2 settings updated" });
    }

    // ==================== HTTP 安全性設定 ====================

    /// <summary>
    /// 獲取 HTTP 安全性設定
    /// </summary>
    [HttpGet("http-security")]
    [SwaggerOperation(Summary = "獲取 HTTP 安全性設定 (Cookie, Headers, CSP, CORS)")]
    public async Task<IActionResult> GetHttpSecuritySettings()
    {
        var result = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity");
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }
        // 如果還沒有設定，返回標準模板
        return Ok(result.Data ?? SecurityTemplates.Standard);
    }

    /// <summary>
    /// 更新 HTTP 安全性設定
    /// </summary>
    [HttpPut("http-security")]
    [SwaggerOperation(Summary = "更新 HTTP 安全性設定")]
    public async Task<IActionResult> UpdateHttpSecuritySettings([FromBody] HttpSecuritySettingsDto settings)
    {
        // 設定為自訂模式
        settings.ActiveTemplate = "custom";

        var result = await _settingService.UpdateSettingAsync("HttpSecurity", settings);
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        // 產生 Nginx 設定檔
        await GenerateNginxConfigAsync(settings);

        // 觸發 Nginx reload
        var (reloadSuccess, reloadMessage) = await _nginxReloadService.ReloadNginxAsync();

        // 清除快取
        _httpSecuritySettingsProvider.ClearCache();

        return Ok(new
        {
            message = "HTTP security settings updated",
            nginxReloaded = reloadSuccess,
            nginxReloadMessage = reloadMessage
        });
    }

    /// <summary>
    /// 套用安全性模板
    /// </summary>
    [HttpPost("http-security/apply-template/{templateName}")]
    [SwaggerOperation(Summary = "套用安全性模板 (strict/standard/relaxed)")]
    public async Task<IActionResult> ApplySecurityTemplate(string templateName)
    {
        var validTemplates = new[] { "strict", "standard", "relaxed" };
        if (!validTemplates.Contains(templateName.ToLower()))
        {
            return BadRequest(new { error = $"Invalid template name. Valid values: {string.Join(", ", validTemplates)}" });
        }

        var template = SecurityTemplates.GetTemplate(templateName);
        var result = await _settingService.UpdateSettingAsync("HttpSecurity", template);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        // 產生 Nginx 設定檔
        await GenerateNginxConfigAsync(template);

        // 觸發 Nginx reload
        var (reloadSuccess, reloadMessage) = await _nginxReloadService.ReloadNginxAsync();

        // 清除快取
        _httpSecuritySettingsProvider.ClearCache();

        return Ok(new
        {
            message = $"Applied '{templateName}' security template",
            settings = template,
            nginxReloaded = reloadSuccess,
            nginxReloadMessage = reloadMessage
        });
    }

    /// <summary>
    /// 強制重新產生 Nginx 設定並觸發 Nginx 重新載入
    /// </summary>
    [HttpPost("http-security/reload-nginx")]
    [SwaggerOperation(Summary = "強制重新產生 Nginx 設定", Description = "從資料庫讀取目前設定，重新產生 Nginx config 檔案，並透過 Docker 命令觸發 Nginx reload。")]
    public async Task<IActionResult> ReloadNginxConfig()
    {
        var configPath = Environment.GetEnvironmentVariable("SecuritySettings__NginxConfigPath");
        if (string.IsNullOrEmpty(configPath))
        {
            return Ok(new { message = "開發環境無需重新載入 Nginx", reloaded = false });
        }

        try
        {
            var result = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity");
            var settings = result.Data ?? SecurityTemplates.Standard;

            var directory = Path.GetDirectoryName(configPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 寫入完整版（含 CSP）
            var configContent = GenerateNginxConfigContent(settings);
            await System.IO.File.WriteAllTextAsync(configPath, configContent);

            // 寫入無 CSP 版（供前台使用）
            var noCspFileName = Path.GetFileNameWithoutExtension(configPath) + "-no-csp" + Path.GetExtension(configPath);
            var noCspPath = Path.Combine(directory!, noCspFileName);
            var noCspContent = SPS.Infrastructure.Services.NginxConfigGenerator.GenerateWithoutCsp(settings);
            await System.IO.File.WriteAllTextAsync(noCspPath, noCspContent);

            // 觸發 Nginx reload
            var (reloadSuccess, reloadMessage) = await _nginxReloadService.ReloadNginxAsync();

            return Ok(new
            {
                message = reloadSuccess
                    ? "Nginx 設定已重新產生並重新載入成功"
                    : $"Nginx 設定已重新產生，但重新載入失敗: {reloadMessage}",
                reloaded = reloadSuccess,
                generatedAt = DateTime.UtcNow,
                reloadDetails = reloadMessage
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"重新產生 Nginx 設定失敗: {ex.Message}" });
        }
    }

    /// <summary>
    /// 匯出 Nginx 設定
    /// </summary>
    [HttpGet("http-security/export/nginx")]
    [SwaggerOperation(Summary = "匯出 Nginx Security Headers 設定")]
    public async Task<IActionResult> ExportNginxConfig()
    {
        var result = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity");
        var settings = result.Data ?? SecurityTemplates.Standard;

        var configContent = GenerateNginxConfigContent(settings);

        return Ok(new NginxConfigExportDto
        {
            ConfigContent = configContent,
            FileName = "security-headers.conf",
            GeneratedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// 下載 Nginx 設定檔
    /// </summary>
    [HttpGet("http-security/export/nginx/download")]
    [SwaggerOperation(Summary = "下載 Nginx Security Headers 設定檔")]
    public async Task<IActionResult> DownloadNginxConfig()
    {
        var result = await _settingService.GetSettingAsync<HttpSecuritySettingsDto>("HttpSecurity");
        var settings = result.Data ?? SecurityTemplates.Standard;

        var configContent = GenerateNginxConfigContent(settings);
        var bytes = System.Text.Encoding.UTF8.GetBytes(configContent);

        return File(bytes, "text/plain", "security-headers.conf");
    }

    /// <summary>
    /// 產生 Nginx 設定檔內容（委派給共用產生器）
    /// </summary>
    private string GenerateNginxConfigContent(HttpSecuritySettingsDto settings)
    {
        return SPS.Infrastructure.Services.NginxConfigGenerator.Generate(settings);
    }

    /// <summary>
    /// 產生 Nginx 設定檔到共享目錄
    /// </summary>
    private async Task GenerateNginxConfigAsync(HttpSecuritySettingsDto settings)
    {
        var configPath = Environment.GetEnvironmentVariable("SecuritySettings__NginxConfigPath");
        if (string.IsNullOrEmpty(configPath))
        {
            // 開發環境不產生檔案
            return;
        }

        try
        {
            var directory = Path.GetDirectoryName(configPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 寫入完整版（含 CSP）
            var configContent = GenerateNginxConfigContent(settings);
            await System.IO.File.WriteAllTextAsync(configPath, configContent);

            // 寫入無 CSP 版（供前台使用）
            var noCspFileName = Path.GetFileNameWithoutExtension(configPath) + "-no-csp" + Path.GetExtension(configPath);
            var noCspPath = Path.Combine(directory!, noCspFileName);
            var noCspContent = SPS.Infrastructure.Services.NginxConfigGenerator.GenerateWithoutCsp(settings);
            await System.IO.File.WriteAllTextAsync(noCspPath, noCspContent);
        }
        catch (Exception ex)
        {
            // 記錄錯誤但不中斷流程
            Console.WriteLine($"Warning: Failed to write Nginx config file: {ex.Message}");
        }
    }

    /// <summary>
    /// 獲取預設信件範本
    /// </summary>
    private void MergeWithDefaultTemplates(List<EmailTemplate> templates)
    {
        var defaults = GetDefaultEmailTemplates();
        var existingKeys = templates.Select(t => t.Key).ToHashSet();
        foreach (var d in defaults.Where(d => !existingKeys.Contains(d.Key)))
            templates.Add(d);
    }

    private List<EmailTemplate> GetDefaultEmailTemplates()
    {
        return new List<EmailTemplate>
        {
            new EmailTemplate
            {
                Key = "verification_code",
                Name = "驗證碼郵件",
                Subject = "電子郵件驗證碼 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p>親愛的 {{userName}}，您好！</p>
<p>您正在進行電子郵件驗證，請使用以下驗證碼完成流程：</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 24px; text-align: center; letter-spacing: 5px;'>{{code}}</div>
<p>此驗證碼將在 {{expireMinutes}} 分鐘內有效。</p>
<p>如果您並未要求進行此操作，請忽略此郵件。</p>",
                AvailableVariables = new List<string> { "code", "userName", "expireMinutes" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "password_reset",
                Name = "密碼重設",
                Subject = "密碼重設請求 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p>親愛的 {{userName}}，您好！</p>
<p>我們收到了您的密碼重設請求。請點擊下方按鈕來重設您的密碼。</p>
<p><a href='{{resetLink}}' style='display: inline-block; background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;'>重設密碼</a></p>
<p>此連結將在 {{expireMinutes}} 分鐘後失效。</p>
<p>如果這不是您發起的請求，請忽略此郵件。</p>",
                AvailableVariables = new List<string> { "resetLink", "userName", "expireMinutes" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "password_changed",
                Name = "密碼修改通知",
                Subject = "密碼已變更 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p>親愛的 {{userName}}，您好！</p>
<p>您的密碼已於 {{changeTime}} 成功變更。</p>
<p>變更 IP 地址：{{ipAddress}}</p>
<p>如果這不是您本人的操作，請立即聯繫系統管理員。</p>",
                AvailableVariables = new List<string> { "userName", "changeTime", "ipAddress" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "welcome",
                Name = "歡迎郵件",
                Subject = "歡迎加入 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p>親愛的 {{userName}}，您好！</p>
<p>歡迎加入智慧石化產業資訊暨媒合平台！</p>
<p>您現在可以登入系統開始使用各項服務。</p>
<p><a href='{{loginUrl}}' style='display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;'>立即登入</a></p>",
                AvailableVariables = new List<string> { "userName", "loginUrl" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "verification_url",
                Name = "電子郵件驗證連結",
                Subject = "驗證您的電子郵件地址 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>您好，</p>
<p style='margin-bottom: 16px;'>請點擊下方按鈕來驗證您的電子郵件地址。此驗證連結將在 24 小時後失效。</p>
<div style='text-align: center; margin: 24px 0;'>
    <a href='{{verificationLink}}' style='display: inline-block; background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold;'>驗證電子郵件</a>
</div>
<p style='margin-bottom: 16px;'>如果您沒有註冊帳號，請忽略此郵件。</p>",
                AvailableVariables = new List<string> { "verificationLink" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "domain_verification",
                Name = "域名驗證",
                Subject = "域名驗證 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>您好，</p>
<p style='margin-bottom: 16px;'>您的組織 {{organizationName}} 已請求域名驗證。請使用以下驗證令牌來完成域名驗證流程：</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; word-break: break-all;'>{{verificationToken}}</div>
<p style='margin-bottom: 16px;'>請將此令牌添加到您的域名 DNS TXT 記錄中以完成驗證。</p>",
                AvailableVariables = new List<string> { "organizationName", "verificationToken" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "application_submitted",
                Name = "申請提交確認",
                Subject = "申請已提交 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>感謝您提交會員申請。您的申請已成功提交至系統。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}
</div>
<p style='margin-bottom: 16px;'>我們的審核團隊將盡快處理您的申請。審核結果將通過電子郵件通知您。</p>
<p style='margin-bottom: 16px;'>審核過程通常需要 1-3 個工作日，請耐心等待。</p>",
                AvailableVariables = new List<string> { "contactName", "applicationNumber" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "new_application_notification",
                Name = "新申請通知（審核員）",
                Subject = "新會員申請通知 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>您好！</p>
<p style='margin-bottom: 16px;'>系統收到一筆新的會員申請，請至後台審核。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>申請人信箱：</strong>{{applicantEmail}}
</div>",
                AvailableVariables = new List<string> { "applicationNumber", "applicantEmail" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "application_approved",
                Name = "申請通過",
                Subject = "申請已通過 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>恭喜！您的會員申請已通過審核。</p>
<div style='background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>審核結果：</strong><span style='color: #4caf50; font-weight: bold;'>通過</span>
</div>
<p style='margin-bottom: 16px;'>您現在可以使用註冊時填寫的郵箱和密碼登入系統。</p>
<p><a href='{{loginUrl}}' style='display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;'>立即登入</a></p>",
                AvailableVariables = new List<string> { "contactName", "applicationNumber", "loginUrl" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "application_rejected",
                Name = "申請拒絕",
                Subject = "申請未通過 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>很抱歉，您的會員申請未能通過審核。</p>
<div style='background-color: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>審核結果：</strong><span style='color: #f44336; font-weight: bold;'>未通過</span>
</div>
<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;'>
    <strong>拒絕原因：</strong><br>
    {{rejectionReason}}
</div>
<p style='margin-bottom: 16px;'>如對審核結果有疑問，歡迎與我們聯繫。</p>
<p style='margin-bottom: 16px;'>您可以在修正相關問題後重新提交申請。</p>",
                AvailableVariables = new List<string> { "contactName", "applicationNumber", "rejectionReason" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "application_document_required",
                Name = "申請補件通知",
                Subject = "申請補件通知 - 智慧石化產業資訊暨媒合平台",
                HtmlContent = @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>您的會員申請需要補充文件。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}
</div>
<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;'>
    <strong>需補充文件：</strong><br>
    {{requiredDocuments}}
</div>
<p style='margin-bottom: 16px;'>請盡快補充所需文件，以便我們繼續處理您的申請。</p>",
                AvailableVariables = new List<string> { "contactName", "applicationNumber", "requiredDocuments" },
                IsActive = true
            },
            new EmailTemplate
            {
                Key = "demand_match_notification",
                Name = "需求媒合通知（供給端）",
                Subject = "解決方案媒合需求-智慧石化計畫輔導轉介",
                HtmlContent = @"<p>您好，本計畫執行產業智慧安全升級輔導，近日有受輔導業者經過建議，綜整導入需求/建議如下。</p>
<div style='background:#f8f9fa;border-left:4px solid #1976d2;padding:16px;margin:16px 0;'>
  <h3 style='margin:0 0 8px;color:#1976d2;'>{{demandName}}</h3>
  <p style='white-space:pre-line;'>{{demandIntroduction}}</p>
</div>
<p>根據貴司在媒合平台所登載的技術服務項目與智慧技術標籤，專業顧問團隊評估後認為，貴司擁有的技術方案與此需求高度契合。</p>
<p>因此，誠摯邀請貴司參閱上述需求，並於此統之後一週內提供對應的智慧化解決方案相關資訊（如簡介、案例等），以利後續媒合及廠方評估。若廠方對方案有進一步興趣，我們將立即安排雙方進廠進行細部規劃討論。</p>
<p>如有任何問題歡迎隨時與我們聯繫。感謝貴司的協助與支持。</p>
<p>聯繫資訊：<a href='mailto:exyway13@mail.isha.org.tw'>exyway13@mail.isha.org.tw</a>、07-5503115#22 潘恆毅副工程師</p>
<div style='margin-top:16px;'><strong>需求標籤：</strong><br>{{demandTags}}</div>",
                AvailableVariables = new List<string> { "demandName", "demandIntroduction", "demandTags" },
                IsActive = true
            }
        };
    }

    // ==================== 退信處理設定 ====================

    /// <summary>
    /// 獲取退信處理設定
    /// </summary>
    [HttpGet("bounce-mail")]
    [SwaggerOperation(Summary = "獲取退信處理設定（IMAP 連線資訊）")]
    public async Task<IActionResult> GetBounceMailSettings()
    {
        var result = await _settingService.GetSettingAsync<BounceMailSettingsDto>("BounceMail");
        return result.IsSuccess ? Ok(result.Data ?? new BounceMailSettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 更新退信處理設定
    /// </summary>
    [HttpPut("bounce-mail")]
    [SwaggerOperation(Summary = "更新退信處理設定（IMAP 連線資訊）")]
    public async Task<IActionResult> UpdateBounceMailSettings([FromBody] BounceMailSettingsDto settings)
    {
        var result = await _settingService.UpdateSettingAsync("BounceMail", settings);
        return result.IsSuccess ? Ok(new { message = "退信處理設定已更新" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 手動觸發退信處理
    /// </summary>
    [HttpPost("bounce-mail/process")]
    [SwaggerOperation(Summary = "手動觸發退信處理", Description = "立即連線 IMAP 伺服器檢查並處理退信郵件")]
    public async Task<IActionResult> ProcessBounces(
        [FromServices] Infrastructure.Services.BounceProcessingService bounceService,
        CancellationToken cancellationToken)
    {
        var settingResult = await _settingService.GetSettingAsync<BounceMailSettingsDto>("BounceMail");
        if (!settingResult.IsSuccess || settingResult.Data == null)
        {
            return BadRequest(new { error = "退信處理設定未配置" });
        }

        var settings = settingResult.Data;
        if (string.IsNullOrEmpty(settings.ImapServer) || string.IsNullOrEmpty(settings.Username))
        {
            return BadRequest(new { error = "請先設定 IMAP 伺服器資訊" });
        }

        // 臨時啟用以便測試
        settings.Enabled = true;

        var result = await bounceService.ProcessBouncesAsync(settings, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new
        {
            success = true,
            message = "退信處理完成",
            totalFound = result.TotalFound,
            processedCount = result.ProcessedCount,
            skippedCount = result.SkippedCount,
            errorCount = result.ErrorCount
        });
    }

    /// <summary>
    /// 測試 IMAP 連線
    /// </summary>
    [HttpPost("bounce-mail/test-connection")]
    [SwaggerOperation(Summary = "測試 IMAP 連線", Description = "測試 IMAP 伺服器連線是否正常")]
    public async Task<IActionResult> TestImapConnection([FromBody] BounceMailSettingsDto settings)
    {
        try
        {
            using var client = new MailKit.Net.Imap.ImapClient();

            await client.ConnectAsync(settings.ImapServer, settings.ImapPort, settings.UseSsl);
            await client.AuthenticateAsync(settings.Username, settings.Password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(MailKit.FolderAccess.ReadOnly);

            var messageCount = inbox.Count;

            await client.DisconnectAsync(true);

            return Ok(new
            {
                success = true,
                message = "IMAP 連線成功",
                messageCount = messageCount
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                success = false,
                message = $"IMAP 連線失敗: {ex.Message}"
            });
        }
    }

    // ==================== ProTrack 整合設定 ====================

    [HttpGet("protrack")]
    [SwaggerOperation(Summary = "取得 ProTrack 整合設定")]
    public async Task<IActionResult> GetProTrackSettings(CancellationToken ct)
    {
        var result = await _settingService.GetSettingAsync<ProTrackSettingsDto>("ProTrack", ct);
        return result.IsSuccess ? Ok(result.Data) : Ok(new ProTrackSettingsDto());
    }

    [HttpPut("protrack")]
    [SwaggerOperation(Summary = "更新 ProTrack 整合設定")]
    public async Task<IActionResult> UpdateProTrackSettings([FromBody] ProTrackSettingsDto settings, CancellationToken ct)
    {
        var result = await _settingService.UpdateSettingAsync("ProTrack", settings, ct);
        return result.IsSuccess ? Ok(new { message = "ProTrack 設定已更新" }) : BadRequest(new { error = result.Error });
    }

    [HttpPost("protrack/test")]
    [SwaggerOperation(Summary = "測試 ProTrack 連線（不儲存設定）")]
    public async Task<IActionResult> TestProTrackConnection([FromBody] ProTrackSettingsDto settings, CancellationToken ct)
    {
        var result = await _proTrackService.TestConnectionAsync(settings, ct);
        if (result.IsSuccess)
            return Ok(new { success = true, count = result.Data, message = $"連線成功，找到 {result.Data} 筆記錄" });
        return Ok(new { success = false, message = result.Error });
    }

    // ==================== AI 語意搜尋設定 ====================

    [HttpGet("embedding")]
    [SwaggerOperation(Summary = "取得 AI 語意搜尋設定")]
    public async Task<IActionResult> GetEmbeddingSettings(CancellationToken ct)
    {
        var result = await _settingService.GetSettingAsync<EmbeddingSettingsDto>("Embedding", ct);
        return result.IsSuccess ? Ok(result.Data) : Ok(new EmbeddingSettingsDto());
    }

    [HttpPut("embedding")]
    [SwaggerOperation(Summary = "更新 AI 語意搜尋設定")]
    public async Task<IActionResult> UpdateEmbeddingSettings([FromBody] EmbeddingSettingsDto settings, CancellationToken ct)
    {
        var result = await _settingService.UpdateSettingAsync("Embedding", settings, ct);
        return result.IsSuccess ? Ok(new { message = "AI 語意搜尋設定已更新" }) : BadRequest(new { error = result.Error });
    }

    [HttpPost("embedding/test")]
    [SwaggerOperation(Summary = "測試 AI 語意搜尋連線（不儲存設定）")]
    public async Task<IActionResult> TestEmbeddingConnection([FromBody] EmbeddingSettingsDto settings, CancellationToken ct)
    {
        var result = await _embeddingService.TestConnectionAsync(settings, ct);
        return Ok(result);
    }
}
