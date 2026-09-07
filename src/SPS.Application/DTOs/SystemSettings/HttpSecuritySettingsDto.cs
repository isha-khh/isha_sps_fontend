namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// HTTP 安全性設定 - 完整 DTO
/// </summary>
public class HttpSecuritySettingsDto
{
    /// <summary>
    /// 使用的模板 (strict / standard / relaxed / custom)
    /// </summary>
    public string ActiveTemplate { get; set; } = "standard";

    /// <summary>
    /// Cookie 安全設定
    /// </summary>
    public CookieSecuritySettingsDto Cookie { get; set; } = new();

    /// <summary>
    /// Security Headers 設定
    /// </summary>
    public SecurityHeadersSettingsDto Headers { get; set; } = new();

    /// <summary>
    /// CSP 設定
    /// </summary>
    public CspSettingsDto Csp { get; set; } = new();

    /// <summary>
    /// CORS 設定
    /// </summary>
    public CorsSettingsDto Cors { get; set; } = new();
}

/// <summary>
/// Cookie 安全設定
/// </summary>
public class CookieSecuritySettingsDto
{
    /// <summary>
    /// 是否啟用 HttpOnly (防止 JS 存取)
    /// </summary>
    public bool HttpOnly { get; set; } = true;

    /// <summary>
    /// 是否啟用 Secure (僅 HTTPS 傳輸)
    /// </summary>
    public bool Secure { get; set; } = true;

    /// <summary>
    /// SameSite 設定 (Strict / Lax / None)
    /// </summary>
    public string SameSite { get; set; } = "Lax";

    /// <summary>
    /// AccessToken 效期 (分鐘)
    /// </summary>
    public int AccessTokenExpiryMinutes { get; set; } = 30;

    /// <summary>
    /// RefreshToken 效期 (天)
    /// </summary>
    public int RefreshTokenExpiryDays { get; set; } = 7;
}

/// <summary>
/// Security Headers 設定
/// </summary>
public class SecurityHeadersSettingsDto
{
    /// <summary>
    /// 啟用 X-CSRF-TOKEN 驗證
    /// </summary>
    public bool EnableCsrfToken { get; set; } = true;

    /// <summary>
    /// 啟用 X-XSS-Protection
    /// </summary>
    public bool EnableXssProtection { get; set; } = true;

    /// <summary>
    /// 啟用 HSTS (Strict-Transport-Security)
    /// </summary>
    public bool EnableHsts { get; set; } = true;

    /// <summary>
    /// HSTS max-age (秒)
    /// </summary>
    public int HstsMaxAge { get; set; } = 31536000; // 1 年

    /// <summary>
    /// HSTS 是否包含子網域
    /// </summary>
    public bool HstsIncludeSubDomains { get; set; } = true;

    /// <summary>
    /// 啟用 X-Content-Type-Options: nosniff
    /// </summary>
    public bool EnableContentTypeNosniff { get; set; } = true;

    /// <summary>
    /// 啟用 X-Frame-Options
    /// </summary>
    public bool EnableFrameOptions { get; set; } = true;

    /// <summary>
    /// X-Frame-Options 值 (DENY / SAMEORIGIN)
    /// </summary>
    public string FrameOptionsPolicy { get; set; } = "SAMEORIGIN";

    /// <summary>
    /// 啟用 Referrer-Policy
    /// </summary>
    public bool EnableReferrerPolicy { get; set; } = true;

    /// <summary>
    /// Referrer-Policy 值
    /// </summary>
    public string ReferrerPolicy { get; set; } = "strict-origin-when-cross-origin";

    /// <summary>
    /// 啟用 Permissions-Policy
    /// </summary>
    public bool EnablePermissionsPolicy { get; set; } = true;

    /// <summary>
    /// Permissions-Policy 值
    /// </summary>
    public string PermissionsPolicy { get; set; } = "geolocation=(), microphone=(), camera=()";

    /// <summary>
    /// 啟用 Cross-Origin-Embedder-Policy
    /// </summary>
    public bool EnableCoep { get; set; } = true;

    /// <summary>
    /// COEP 值 (require-corp / unsafe-none / credentialless)
    /// </summary>
    public string CoepPolicy { get; set; } = "require-corp";

    /// <summary>
    /// 啟用 Cross-Origin-Opener-Policy
    /// </summary>
    public bool EnableCoop { get; set; } = true;

    /// <summary>
    /// COOP 值 (same-origin / same-origin-allow-popups / unsafe-none)
    /// </summary>
    public string CoopPolicy { get; set; } = "same-origin";

    /// <summary>
    /// 啟用 Cross-Origin-Resource-Policy
    /// </summary>
    public bool EnableCorp { get; set; } = true;

    /// <summary>
    /// CORP 值 (same-origin / same-site / cross-origin)
    /// </summary>
    public string CorpPolicy { get; set; } = "same-origin";
}

/// <summary>
/// CSP (Content Security Policy) 設定
/// </summary>
public class CspSettingsDto
{
    /// <summary>
    /// 是否啟用 CSP
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 是否為 Report-Only 模式 (僅報告，不阻擋)
    /// </summary>
    public bool ReportOnly { get; set; } = false;

    /// <summary>
    /// default-src 指令
    /// </summary>
    public string DefaultSrc { get; set; } = "'self'";

    /// <summary>
    /// script-src 指令
    /// </summary>
    public string ScriptSrc { get; set; } = "'self' 'unsafe-inline' 'unsafe-eval'";

    /// <summary>
    /// script-src-elem 指令 (控制 &lt;script&gt; 元素)
    /// </summary>
    public string? ScriptSrcElem { get; set; }

    /// <summary>
    /// script-src-attr 指令 (控制 inline 事件處理器，如 onclick="")
    /// </summary>
    public string? ScriptSrcAttr { get; set; }

    /// <summary>
    /// style-src 指令
    /// </summary>
    public string StyleSrc { get; set; } = "'self' 'unsafe-inline'";

    /// <summary>
    /// style-src-elem 指令 (控制 &lt;style&gt; 元素和 &lt;link rel="stylesheet"&gt;)
    /// </summary>
    public string? StyleSrcElem { get; set; }

    /// <summary>
    /// style-src-attr 指令 (控制 inline style="" 屬性)
    /// </summary>
    public string? StyleSrcAttr { get; set; }

    /// <summary>
    /// img-src 指令
    /// </summary>
    public string ImgSrc { get; set; } = "'self' data: https:";

    /// <summary>
    /// font-src 指令
    /// </summary>
    public string FontSrc { get; set; } = "'self' data:";

    /// <summary>
    /// media-src 指令 (控制 &lt;audio&gt; 和 &lt;video&gt;)
    /// </summary>
    public string? MediaSrc { get; set; }

    /// <summary>
    /// connect-src 指令
    /// </summary>
    public string ConnectSrc { get; set; } = "'self' https: wss:";

    /// <summary>
    /// worker-src 指令 (控制 Web Worker / Service Worker)
    /// </summary>
    public string? WorkerSrc { get; set; }

    /// <summary>
    /// frame-src 指令
    /// </summary>
    public string FrameSrc { get; set; } = "'self'";

    /// <summary>
    /// frame-ancestors 指令
    /// </summary>
    public string FrameAncestors { get; set; } = "'self'";

    /// <summary>
    /// object-src 指令
    /// </summary>
    public string ObjectSrc { get; set; } = "'none'";

    /// <summary>
    /// base-uri 指令
    /// </summary>
    public string BaseUri { get; set; } = "'self'";

    /// <summary>
    /// form-action 指令
    /// </summary>
    public string FormAction { get; set; } = "'self'";

    /// <summary>
    /// 自動將 HTTP 升級為 HTTPS
    /// </summary>
    public bool UpgradeInsecureRequests { get; set; } = false;

    /// <summary>
    /// 違規報告 URI
    /// </summary>
    public string? ReportUri { get; set; }
}

/// <summary>
/// CORS 設定
/// </summary>
public class CorsSettingsDto
{
    /// <summary>
    /// 是否信任 Proxy Headers (X-Real-IP, X-Forwarded-For)
    /// </summary>
    public bool TrustProxyHeaders { get; set; } = true;

    /// <summary>
    /// 允許的來源清單
    /// </summary>
    public List<string> AllowedOrigins { get; set; } = new();

    /// <summary>
    /// 是否允許憑證
    /// </summary>
    public bool AllowCredentials { get; set; } = true;

    /// <summary>
    /// 允許的 Methods
    /// </summary>
    public List<string> AllowedMethods { get; set; } = new()
    {
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
    };

    /// <summary>
    /// 允許的 Headers
    /// </summary>
    public List<string> AllowedHeaders { get; set; } = new()
    {
        "Content-Type", "Authorization", "X-Requested-With", "X-CSRF-TOKEN"
    };
}

/// <summary>
/// 安全性模板
/// </summary>
public static class SecurityTemplates
{
    /// <summary>
    /// 嚴格模式
    /// </summary>
    public static HttpSecuritySettingsDto Strict => new()
    {
        ActiveTemplate = "strict",
        Cookie = new CookieSecuritySettingsDto
        {
            HttpOnly = true,
            Secure = true,
            SameSite = "Strict",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 1
        },
        Headers = new SecurityHeadersSettingsDto
        {
            EnableCsrfToken = true,
            EnableXssProtection = true,
            EnableHsts = true,
            HstsMaxAge = 31536000,
            HstsIncludeSubDomains = true,
            EnableContentTypeNosniff = true,
            EnableFrameOptions = true,
            FrameOptionsPolicy = "DENY",
            EnableReferrerPolicy = true,
            ReferrerPolicy = "no-referrer",
            EnablePermissionsPolicy = true,
            PermissionsPolicy = "geolocation=(), microphone=(), camera=(), payment=()",
            EnableCoep = true,
            CoepPolicy = "require-corp",
            EnableCoop = true,
            CoopPolicy = "same-origin",
            EnableCorp = true,
            CorpPolicy = "same-origin"
        },
        Csp = new CspSettingsDto
        {
            Enabled = true,
            ReportOnly = false,
            DefaultSrc = "'self'",
            ScriptSrc = "'self'",
            StyleSrc = "'self'",
            ImgSrc = "'self' data:",
            FontSrc = "'self'",
            ConnectSrc = "'self'",
            FrameSrc = "'none'",
            FrameAncestors = "'none'",
            ObjectSrc = "'none'",
            BaseUri = "'self'",
            FormAction = "'self'"
        }
    };

    /// <summary>
    /// 標準模式 (推薦)
    /// </summary>
    public static HttpSecuritySettingsDto Standard => new()
    {
        ActiveTemplate = "standard",
        Cookie = new CookieSecuritySettingsDto
        {
            HttpOnly = true,
            Secure = true,
            SameSite = "Lax",
            AccessTokenExpiryMinutes = 30,
            RefreshTokenExpiryDays = 7
        },
        Headers = new SecurityHeadersSettingsDto
        {
            EnableCsrfToken = true,
            EnableXssProtection = true,
            EnableHsts = true,
            HstsMaxAge = 31536000,
            HstsIncludeSubDomains = true,
            EnableContentTypeNosniff = true,
            EnableFrameOptions = true,
            FrameOptionsPolicy = "SAMEORIGIN",
            EnableReferrerPolicy = true,
            ReferrerPolicy = "strict-origin-when-cross-origin",
            EnablePermissionsPolicy = true,
            PermissionsPolicy = "geolocation=(), microphone=(), camera=()",
            EnableCoep = true,
            CoepPolicy = "require-corp",
            EnableCoop = true,
            CoopPolicy = "same-origin",
            EnableCorp = true,
            CorpPolicy = "same-origin"
        },
        Csp = new CspSettingsDto
        {
            Enabled = true,
            ReportOnly = false,
            DefaultSrc = "'self'",
            ScriptSrc = "'self' 'unsafe-inline' 'unsafe-eval'",
            ScriptSrcElem = "'self' 'unsafe-inline' https://static.cloudflareinsights.com",
            StyleSrc = "'self' 'unsafe-inline'",
            StyleSrcElem = "'self' 'unsafe-inline' https://fonts.googleapis.com https://rsms.me",
            ImgSrc = "'self' data: https:",
            FontSrc = "'self' data: https://fonts.gstatic.com https://rsms.me",
            ConnectSrc = "'self' https: wss:",
            FrameSrc = "'self'",
            FrameAncestors = "'self'",
            ObjectSrc = "'none'",
            BaseUri = "'self'",
            FormAction = "'self'"
        }
    };

    /// <summary>
    /// 寬鬆模式 (開發用)
    /// </summary>
    public static HttpSecuritySettingsDto Relaxed => new()
    {
        ActiveTemplate = "relaxed",
        Cookie = new CookieSecuritySettingsDto
        {
            HttpOnly = true,
            Secure = false,
            SameSite = "Lax",
            AccessTokenExpiryMinutes = 60,
            RefreshTokenExpiryDays = 30
        },
        Headers = new SecurityHeadersSettingsDto
        {
            EnableCsrfToken = false,
            EnableXssProtection = true,
            EnableHsts = false,
            HstsMaxAge = 0,
            HstsIncludeSubDomains = false,
            EnableContentTypeNosniff = true,
            EnableFrameOptions = true,
            FrameOptionsPolicy = "SAMEORIGIN",
            EnableReferrerPolicy = true,
            ReferrerPolicy = "no-referrer-when-downgrade",
            EnablePermissionsPolicy = false,
            PermissionsPolicy = "",
            EnableCoep = false,
            CoepPolicy = "unsafe-none",
            EnableCoop = false,
            CoopPolicy = "unsafe-none",
            EnableCorp = false,
            CorpPolicy = "cross-origin"
        },
        Csp = new CspSettingsDto
        {
            Enabled = false,
            ReportOnly = true,
            DefaultSrc = "'self' https: data:",
            ScriptSrc = "'self' 'unsafe-inline' 'unsafe-eval' https:",
            StyleSrc = "'self' 'unsafe-inline' https:",
            ImgSrc = "* data: blob:",
            FontSrc = "* data:",
            ConnectSrc = "*",
            FrameSrc = "*",
            FrameAncestors = "*",
            ObjectSrc = "'self'",
            BaseUri = "'self'",
            FormAction = "*"
        }
    };

    /// <summary>
    /// 根據名稱取得模板
    /// </summary>
    public static HttpSecuritySettingsDto GetTemplate(string templateName)
    {
        return templateName.ToLower() switch
        {
            "strict" => Strict,
            "standard" => Standard,
            "relaxed" => Relaxed,
            _ => Standard
        };
    }
}

/// <summary>
/// Nginx 設定匯出結果
/// </summary>
public class NginxConfigExportDto
{
    /// <summary>
    /// 設定檔內容
    /// </summary>
    public string ConfigContent { get; set; } = "";

    /// <summary>
    /// 檔案名稱
    /// </summary>
    public string FileName { get; set; } = "security-headers.conf";

    /// <summary>
    /// 產生時間
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
