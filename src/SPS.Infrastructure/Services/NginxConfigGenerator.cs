using System.Text;
using SPS.Application.DTOs.SystemSettings;

namespace SPS.Infrastructure.Services;

/// <summary>
/// Nginx 設定檔內容產生器（共用邏輯）
/// </summary>
public static class NginxConfigGenerator
{
    /// <summary>
    /// 產生 Nginx Security Headers 設定檔內容（含 CSP）
    /// </summary>
    public static string Generate(HttpSecuritySettingsDto settings)
    {
        return GenerateInternal(settings, includeCsp: true);
    }

    /// <summary>
    /// 產生 Nginx Security Headers 設定檔內容（不含 CSP，供前台使用 nonce-based CSP）
    /// </summary>
    public static string GenerateWithoutCsp(HttpSecuritySettingsDto settings)
    {
        return GenerateInternal(settings, includeCsp: false);
    }

    private static string GenerateInternal(HttpSecuritySettingsDto settings, bool includeCsp)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# ==============================================");
        sb.AppendLine("# SPS Security Headers - 自動產生");
        sb.AppendLine($"# 產生時間: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"# 使用模板: {settings.ActiveTemplate}");
        if (!includeCsp)
            sb.AppendLine("# CSP 由前台 Next.js middleware 以 nonce 方式處理");
        sb.AppendLine("# ==============================================");
        sb.AppendLine();

        if (settings.Headers.EnableXssProtection)
        {
            sb.AppendLine("# XSS Protection");
            sb.AppendLine("add_header X-XSS-Protection \"1; mode=block\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableContentTypeNosniff)
        {
            sb.AppendLine("# Content Type Options");
            sb.AppendLine("add_header X-Content-Type-Options \"nosniff\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableFrameOptions)
        {
            sb.AppendLine("# Frame Options");
            sb.AppendLine($"add_header X-Frame-Options \"{settings.Headers.FrameOptionsPolicy}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableHsts)
        {
            sb.AppendLine("# HSTS (Strict Transport Security)");
            var hstsValue = $"max-age={settings.Headers.HstsMaxAge}";
            if (settings.Headers.HstsIncludeSubDomains)
            {
                hstsValue += "; includeSubDomains";
            }
            sb.AppendLine($"add_header Strict-Transport-Security \"{hstsValue}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableReferrerPolicy)
        {
            sb.AppendLine("# Referrer Policy");
            sb.AppendLine($"add_header Referrer-Policy \"{settings.Headers.ReferrerPolicy}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnablePermissionsPolicy && !string.IsNullOrEmpty(settings.Headers.PermissionsPolicy))
        {
            sb.AppendLine("# Permissions Policy");
            sb.AppendLine($"add_header Permissions-Policy \"{settings.Headers.PermissionsPolicy}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableCoep && !string.IsNullOrEmpty(settings.Headers.CoepPolicy))
        {
            sb.AppendLine("# Cross-Origin-Embedder-Policy");
            sb.AppendLine($"add_header Cross-Origin-Embedder-Policy \"{settings.Headers.CoepPolicy}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableCoop && !string.IsNullOrEmpty(settings.Headers.CoopPolicy))
        {
            sb.AppendLine("# Cross-Origin-Opener-Policy");
            sb.AppendLine($"add_header Cross-Origin-Opener-Policy \"{settings.Headers.CoopPolicy}\" always;");
            sb.AppendLine();
        }

        if (settings.Headers.EnableCorp && !string.IsNullOrEmpty(settings.Headers.CorpPolicy))
        {
            sb.AppendLine("# Cross-Origin-Resource-Policy");
            sb.AppendLine($"add_header Cross-Origin-Resource-Policy \"{settings.Headers.CorpPolicy}\" always;");
            sb.AppendLine();
        }

        if (includeCsp && settings.Csp.Enabled)
        {
            sb.AppendLine("# Content Security Policy");
            var cspHeader = settings.Csp.ReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
            var cspValue = BuildCspValue(settings.Csp);
            sb.AppendLine($"add_header {cspHeader} \"{cspValue}\" always;");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static string BuildCspValue(CspSettingsDto csp)
    {
        var directives = new List<string>();

        if (!string.IsNullOrEmpty(csp.DefaultSrc))
            directives.Add($"default-src {csp.DefaultSrc}");
        if (!string.IsNullOrEmpty(csp.ScriptSrc))
            directives.Add($"script-src {csp.ScriptSrc}");
        if (!string.IsNullOrEmpty(csp.ScriptSrcElem))
            directives.Add($"script-src-elem {csp.ScriptSrcElem}");
        if (!string.IsNullOrEmpty(csp.ScriptSrcAttr))
            directives.Add($"script-src-attr {csp.ScriptSrcAttr}");
        if (!string.IsNullOrEmpty(csp.StyleSrc))
            directives.Add($"style-src {csp.StyleSrc}");
        if (!string.IsNullOrEmpty(csp.StyleSrcElem))
            directives.Add($"style-src-elem {csp.StyleSrcElem}");
        if (!string.IsNullOrEmpty(csp.StyleSrcAttr))
            directives.Add($"style-src-attr {csp.StyleSrcAttr}");
        if (!string.IsNullOrEmpty(csp.ImgSrc))
            directives.Add($"img-src {csp.ImgSrc}");
        if (!string.IsNullOrEmpty(csp.FontSrc))
            directives.Add($"font-src {csp.FontSrc}");
        if (!string.IsNullOrEmpty(csp.MediaSrc))
            directives.Add($"media-src {csp.MediaSrc}");
        if (!string.IsNullOrEmpty(csp.ConnectSrc))
            directives.Add($"connect-src {csp.ConnectSrc}");
        if (!string.IsNullOrEmpty(csp.WorkerSrc))
            directives.Add($"worker-src {csp.WorkerSrc}");
        if (!string.IsNullOrEmpty(csp.FrameSrc))
            directives.Add($"frame-src {csp.FrameSrc}");
        if (!string.IsNullOrEmpty(csp.FrameAncestors))
            directives.Add($"frame-ancestors {csp.FrameAncestors}");
        if (!string.IsNullOrEmpty(csp.ObjectSrc))
            directives.Add($"object-src {csp.ObjectSrc}");
        if (!string.IsNullOrEmpty(csp.BaseUri))
            directives.Add($"base-uri {csp.BaseUri}");
        if (!string.IsNullOrEmpty(csp.FormAction))
            directives.Add($"form-action {csp.FormAction}");
        if (csp.UpgradeInsecureRequests)
            directives.Add("upgrade-insecure-requests");
        if (!string.IsNullOrEmpty(csp.ReportUri))
            directives.Add($"report-uri {csp.ReportUri}");

        return string.Join("; ", directives);
    }
}
