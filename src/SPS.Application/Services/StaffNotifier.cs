using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Application.Services;

/// <summary>
/// 承辦人員通知（見 <see cref="IStaffNotifier"/>）。設定存在系統設定的 "StaffNotification"；
/// 在背景用新的 DI scope 寄送（跟需求媒合通知同樣的做法，避免 request scope 結束後 DbContext 被釋放）。
/// 為了避免被灌表單時一直寄信，全站每小時最多寄 <see cref="MaxMailsPerHour"/> 封，超過的略過（有 log）。
/// </summary>
public class StaffNotifier : IStaffNotifier
{
    private const string SettingsCategory = "StaffNotification";
    private const int MaxMailsPerHour = 60;
    public const int MaxRecipients = 10;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<StaffNotifier> _logger;

    public StaffNotifier(IServiceScopeFactory scopeFactory, IConfiguration configuration, IMemoryCache cache, ILogger<StaffNotifier> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public void Notify(string subject, string headline, IEnumerable<(string Label, string? Value)> detailRows, string adminPath)
    {
        var rows = detailRows.ToList();
        _ = Task.Run(async () =>
        {
            try
            {
                await SendAsync(subject, BuildBody(headline, rows, adminPath), isTest: false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "寄送承辦人員通知失敗：{Subject}", subject);
            }
        });
    }

    public async Task<int> SendTestAsync(CancellationToken ct = default)
    {
        var body = BuildBody("這是一封測試信", new List<(string, string?)> { ("說明", "收到這封信代表承辦人員通知設定正確。") }, "/inquiries");
        return await SendAsync("【SPS】承辦人員通知測試信", body, isTest: true);
    }

    private async Task<int> SendAsync(string subject, string body, bool isTest)
    {
        using var scope = _scopeFactory.CreateScope();
        var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();
        var settings = (await settingService.GetSettingAsync<StaffNotificationSettingsDto>(SettingsCategory)).Data ?? new StaffNotificationSettingsDto();
        if (!settings.Enabled || settings.Recipients.Count == 0) return 0;

        var recipients = settings.Recipients.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(MaxRecipients).ToList();

        if (!isTest)
        {
            var counter = _cache.GetOrCreate("staff-notify-hour", entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
                return new int[1];
            })!;
            if (Interlocked.Add(ref counter[0], recipients.Count) > MaxMailsPerHour)
            {
                _logger.LogWarning("承辦人員通知已達每小時上限 {Max} 封，略過：{Subject}", MaxMailsPerHour, subject);
                return 0;
            }
        }

        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
        // 郵件服務停用時 SendEmailAsync 會靜默略過，不能把它算成「已寄出」
        if (!await email.IsEnabledAsync()) return 0;
        var sent = 0;
        foreach (var to in recipients)
        {
            try
            {
                await email.SendEmailAsync(new EmailOption { To = to, Subject = subject, Body = body, MailType = "StaffNotification" });
                sent++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "寄送承辦人員通知給 {To} 失敗", to);
            }
        }

        return sent;
    }

    private string BuildBody(string headline, List<(string Label, string? Value)> rows, string adminPath)
    {
        var adminBase = (_configuration["App:AdminBaseUrl"] ?? string.Empty).TrimEnd('/');
        var link = string.IsNullOrEmpty(adminBase) ? null : $"{adminBase}{adminPath}";
        static string enc(string value) => WebUtility.HtmlEncode(value);

        var items = string.Concat(rows.Where(r => !string.IsNullOrWhiteSpace(r.Value)).Select(r =>
            $"<tr><td style=\"padding:6px 14px 6px 0;color:#555;white-space:nowrap;vertical-align:top\">{enc(r.Label)}</td><td style=\"padding:6px 0;color:#1a1a1a\">{enc(r.Value!).Replace("\n", "<br>")}</td></tr>"));

        return $"<div style=\"font-family:'Noto Sans TC',Arial,sans-serif;font-size:15px;line-height:1.7\">" +
               $"<p style=\"font-size:17px;font-weight:700;color:#0e3f6b;margin:0 0 12px\">{enc(headline)}</p>" +
               $"<table style=\"border-collapse:collapse\">{items}</table>" +
               (link == null ? string.Empty : $"<p style=\"margin:18px 0 0\"><a href=\"{enc(link)}\" style=\"color:#0052cc\">前往後台查看</a></p>") +
               "<p style=\"margin:18px 0 0;font-size:12px;color:#888\">這是系統自動寄出的通知信，請勿直接回覆。</p></div>";
    }
}
