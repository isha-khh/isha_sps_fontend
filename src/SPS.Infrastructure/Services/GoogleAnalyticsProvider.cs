using System.Text.Json;
using Google.Apis.AnalyticsData.v1beta;
using Google.Apis.AnalyticsData.v1beta.Data;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Domain.Exceptions;
using File = System.IO.File;

namespace SPS.Infrastructure.Services;

public class GoogleAnalyticsProvider : IGoogleAnalyticsProvider
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleAnalyticsProvider> _logger;
    private readonly ISystemSettingService _settingService;

    public GoogleAnalyticsProvider(
        IConfiguration configuration,
        ILogger<GoogleAnalyticsProvider> logger,
        ISystemSettingService settingService)
    {
        _configuration = configuration;
        _logger = logger;
        _settingService = settingService;
    }

    private async Task<(string? PropertyId, string? CredentialsJson)> GetSettingsAsync()
    {
        // ===== 1. 嘗試從資料庫讀取 =====
        try
        {
            var dbSettings = await _settingService.GetSettingAsync<GoogleAnalyticsSettingsDto>("GoogleAnalytics");

            if (dbSettings.IsSuccess && dbSettings.Data != null)
            {
                var propertyId = dbSettings.Data.PropertyId;
                var credentialsElement = dbSettings.Data.CredentialsJson;

                // 檢查 JsonElement 是否有值且不是 Undefined/Null
                var hasCredentials = credentialsElement.HasValue &&
                                     credentialsElement.Value.ValueKind != JsonValueKind.Undefined &&
                                     credentialsElement.Value.ValueKind != JsonValueKind.Null;

                if (!string.IsNullOrEmpty(propertyId) && hasCredentials)
                {
                    // 將 JsonElement 轉回 JSON 字串
                    var credentials = credentialsElement!.Value.GetString();

                    _logger.LogDebug("GA 設定來源: 資料庫");
                    return (propertyId, credentials);
                }

                _logger.LogWarning("GA 設定存在但內容不完整。PropertyId: {PId}, Credentials: {Cred}",
                    string.IsNullOrEmpty(propertyId) ? "缺失" : "已讀取",
                    hasCredentials ? "已讀取" : "缺失");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "從資料庫讀取 GA 設定失敗，將嘗試從設定檔讀取");
        }

        // ===== 2. Fallback: 從 appsettings.json 讀取 =====
        var configPropertyId = _configuration["GoogleAnalytics:PropertyId"];
        var configCredentials = GetCredentialsFromConfig();

        if (!string.IsNullOrEmpty(configPropertyId) && !string.IsNullOrEmpty(configCredentials))
        {
            _logger.LogDebug("GA 設定來源: appsettings.json");
        }

        return (configPropertyId, configCredentials);
    }

    /// <summary>
    /// 從設定檔取得憑證，支援三種方式:
    /// 1. CredentialsJson - 直接存放 JSON 字串
    /// 2. CredentialsFilePath - JSON 檔案路徑
    /// 3. GOOGLE_APPLICATION_CREDENTIALS 環境變數
    /// </summary>
    private string? GetCredentialsFromConfig()
    {
        // 方式 1: 直接讀取 JSON 字串
        var directJson = _configuration["GoogleAnalytics:CredentialsJson"];
        if (!string.IsNullOrEmpty(directJson))
        {
            _logger.LogDebug("使用 CredentialsJson 設定 (直接 JSON)");
            return directJson;
        }

        // 方式 2: 從檔案路徑讀取
        var filePath = _configuration["GoogleAnalytics:CredentialsFilePath"];
        if (!string.IsNullOrEmpty(filePath))
        {
            return ReadCredentialsFromFile(filePath);
        }

        // 方式 3: 從環境變數指定的路徑讀取
        var envPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
        if (!string.IsNullOrEmpty(envPath))
        {
            _logger.LogDebug("使用環境變數 GOOGLE_APPLICATION_CREDENTIALS: {Path}", envPath);
            return ReadCredentialsFromFile(envPath);
        }

        return null;
    }

    /// <summary>
    /// 從檔案讀取憑證 JSON
    /// </summary>
    private string? ReadCredentialsFromFile(string filePath)
    {
        try
        {
            // 處理相對路徑
            if (!Path.IsPathRooted(filePath))
            {
                var basePath = AppContext.BaseDirectory;
                filePath = Path.Combine(basePath, filePath);
            }

            if (!File.Exists(filePath))
            {
                _logger.LogError("GA 憑證檔案不存在: {Path}", filePath);
                return null;
            }

            var json = File.ReadAllText(filePath);

            // 驗證是否為有效 JSON
            if (string.IsNullOrWhiteSpace(json))
            {
                _logger.LogError("GA 憑證檔案內容為空: {Path}", filePath);
                return null;
            }

            _logger.LogDebug("成功從檔案讀取 GA 憑證: {Path}", filePath);
            return json;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "讀取 GA 憑證檔案失敗: {Path}", filePath);
            return null;
        }
    }

    private async Task<AnalyticsDataService> CreateServiceAsync()
    {
        var settings = await GetSettingsAsync();
        var credentialsJson = settings.CredentialsJson;

        if (string.IsNullOrEmpty(credentialsJson))
        {
            throw new ValidationException("GoogleAnalytics", "Credentials JSON content is empty.");
        }

        try
        {
            var credential = GoogleCredential.FromJson(credentialsJson)
                .CreateScoped(AnalyticsDataService.Scope.AnalyticsReadonly);

            return new AnalyticsDataService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "SPS Backend",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析 Google Analytics 憑證 JSON 失敗");
            throw new ValidationException("GoogleAnalytics", "Invalid credentials JSON format.");
        }
    }

    public async Task<List<AnalyticsDailyMetric>> FetchAnalyticsDataAsync(DateOnly startDate, DateOnly endDate)
    {
        var settings = await GetSettingsAsync();
        var propertyId = settings.PropertyId;

        if (string.IsNullOrEmpty(propertyId)) return new List<AnalyticsDailyMetric>();

        try
        {
            var service = await CreateServiceAsync();

            var request = new RunReportRequest
            {
                Property = $"properties/{propertyId}",
                DateRanges = new List<DateRange>
                {
                    new DateRange { StartDate = startDate.ToString("yyyy-MM-dd"), EndDate = endDate.ToString("yyyy-MM-dd") }
                },
                Dimensions = new List<Dimension>
                {
                    new Dimension { Name = "date" }
                },
                Metrics = new List<Metric>
                {
                    new Metric { Name = "activeUsers" },
                    new Metric { Name = "newUsers" },
                    new Metric { Name = "screenPageViews" },
                    new Metric { Name = "sessions" },
                    new Metric { Name = "userEngagementDuration" },
                    new Metric { Name = "eventCount" },
                    new Metric { Name = "bounceRate" },
                    new Metric { Name = "screenPageViewsPerSession" }
                }
            };

            var response = await service.Properties.RunReport(request, $"properties/{propertyId}").ExecuteAsync();
            var results = new List<AnalyticsDailyMetric>();

            if (response.Rows == null) return results;

            foreach (var row in response.Rows)
            {
                var dateStr = row.DimensionValues[0].Value;
                if (!DateOnly.TryParseExact(dateStr, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var date))
                    continue;

                int.TryParse(row.MetricValues[0].Value, out var activeUsers);
                int.TryParse(row.MetricValues[1].Value, out var newUsers);
                int.TryParse(row.MetricValues[2].Value, out var screenPageViews);
                int.TryParse(row.MetricValues[3].Value, out var sessions);
                double.TryParse(row.MetricValues[4].Value, out var totalEngagementTime);
                int.TryParse(row.MetricValues[5].Value, out var eventCount);
                double.TryParse(row.MetricValues[6].Value, out var bounceRate);
                double.TryParse(row.MetricValues[7].Value, out var pagesPerSession);

                double avgEngagement = sessions > 0 ? totalEngagementTime / sessions : 0;

                results.Add(new AnalyticsDailyMetric
                {
                    Date = date,
                    ActiveUsers = activeUsers,
                    NewUsers = newUsers,
                    ScreenPageViews = screenPageViews,
                    Sessions = sessions,
                    AverageEngagementTime = avgEngagement,
                    EventCount = eventCount,
                    BounceRate = bounceRate,
                    ScreenPageViewsPerSession = pagesPerSession
                });
            }

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Google Analytics data.");
            throw;
        }
    }

    public async Task<List<AnalyticsDimensionStatistic>> FetchDimensionStatisticsAsync(DateOnly startDate, DateOnly endDate)
    {
        var settings = await GetSettingsAsync();
        var propertyId = settings.PropertyId;

        if (string.IsNullOrEmpty(propertyId)) return new List<AnalyticsDimensionStatistic>();

        var allStats = new List<AnalyticsDimensionStatistic>();
        var service = await CreateServiceAsync();

        var dimensionsToFetch = new Dictionary<AnalyticsDimensionType, string>
        {
            { AnalyticsDimensionType.DeviceCategory, "deviceCategory" },
            { AnalyticsDimensionType.Browser, "browser" },
            { AnalyticsDimensionType.Country, "country" },
            { AnalyticsDimensionType.Language, "language" }
        };

        foreach (var dim in dimensionsToFetch)
        {
            try
            {
                var request = new RunReportRequest
                {
                    Property = $"properties/{propertyId}",
                    DateRanges = new List<DateRange>
                    {
                        new DateRange { StartDate = startDate.ToString("yyyy-MM-dd"), EndDate = endDate.ToString("yyyy-MM-dd") }
                    },
                    Dimensions = new List<Dimension>
                    {
                        new Dimension { Name = "date" },
                        new Dimension { Name = dim.Value }
                    },
                    Metrics = new List<Metric>
                    {
                        new Metric { Name = "activeUsers" }
                    }
                };

                var response = await service.Properties.RunReport(request, $"properties/{propertyId}").ExecuteAsync();

                if (response.Rows != null)
                {
                    foreach (var row in response.Rows)
                    {
                         var dateStr = row.DimensionValues[0].Value;
                         var dimValue = row.DimensionValues[1].Value;
                         int.TryParse(row.MetricValues[0].Value, out var users);

                         if (DateOnly.TryParseExact(dateStr, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var date))
                         {
                             allStats.Add(new AnalyticsDimensionStatistic
                             {
                                 Date = date,
                                 DimensionType = dim.Key,
                                 DimensionValue = dimValue,
                                 MetricValue = users
                             });
                         }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to fetch dimension {dim.Value}");
            }
        }

        return allStats;
    }
}
