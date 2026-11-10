using SPS.Application.Common;
using SPS.Application.DTOs.Analytics;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGoogleAnalyticsProvider _googleProvider;
    private readonly ISystemSettingService _settingService;

    // 同一個程序同時只跑一個同步（手動按鈕與排程可能撞在一起）
    private static readonly SemaphoreSlim SyncLock = new(1, 1);
    private const string BusyMessage = "同步正在進行中，請稍後再試";
    private const string GaSettingsKey = "GoogleAnalytics";
    private const string SyncStatusKey = "GoogleAnalyticsSyncStatus";
    // 台灣沒有日光節約時間，固定 UTC+8；Linux 容器不一定有 tzdata，不用時區名稱
    private static readonly TimeSpan TaiwanOffset = TimeSpan.FromHours(8);
    private const int MaxAutoAttemptsPerDay = 3;
    private static readonly TimeSpan AutoRetryInterval = TimeSpan.FromMinutes(30);

    public AnalyticsService(IUnitOfWork unitOfWork, IGoogleAnalyticsProvider googleProvider, ISystemSettingService settingService)
    {
        _unitOfWork = unitOfWork;
        _googleProvider = googleProvider;
        _settingService = settingService;
    }

    public async Task<Result> SyncAnalyticsDataAsync(int daysToSync = 1, string trigger = "manual")
    {
        if (!await SyncLock.WaitAsync(0)) return Result.Failure(BusyMessage);
        try
        {
            // 沒設定 Google Analytics 就不要去打 Google（原本會靜默回「成功」但什麼都沒同步，容易誤會）
            var result = await _googleProvider.IsConfiguredAsync()
                ? await SyncCoreAsync(daysToSync)
                : Result.Failure("尚未設定 Google Analytics（資源 ID 與服務帳戶憑證），請到「系統配置 → Google Analytics」填寫");
            await RecordRunAsync(result, daysToSync, trigger);
            return result;
        }
        finally
        {
            SyncLock.Release();
        }
    }

    public async Task<bool> RunAutoSyncIfDueAsync(DateTime nowUtc)
    {
        var settings = await LoadGaSettingsAsync();
        if (!settings.AutoSyncEnabled || settings.ValidateAutoSync() != null) return false;
        if (!TimeSpan.TryParse(settings.AutoSyncTime, out var dueTime)) return false;

        var local = nowUtc + TaiwanOffset;
        if (local.TimeOfDay < dueTime) return false;
        if (!await _googleProvider.IsConfiguredAsync()) return false;

        var today = local.ToString("yyyy-MM-dd");
        var status = await LoadStatusAsync();
        if (status.AutoDoneDate == today) return false;

        var previousAttemptDate = status.AutoAttemptDate;
        var previousAttempts = status.AutoAttempts;
        if (previousAttemptDate == today)
        {
            if (previousAttempts >= MaxAutoAttemptsPerDay) return false;
            if (status.LastAutoAttemptUtc is { } last && nowUtc - last < AutoRetryInterval) return false;
        }

        var result = await SyncAnalyticsDataAsync(settings.AutoSyncDays, "auto");
        // 剛好有人在手動同步：不算一次嘗試，下一分鐘再看
        if (!result.IsSuccess && result.Error == BusyMessage) return false;

        status = await LoadStatusAsync();
        status.AutoAttemptDate = today;
        status.AutoAttempts = previousAttemptDate == today ? previousAttempts + 1 : 1;
        status.LastAutoAttemptUtc = nowUtc;
        if (result.IsSuccess) status.AutoDoneDate = today;
        await SaveStatusAsync(status);
        return true;
    }

    public async Task<AnalyticsSyncStatusResponse> GetSyncStatusAsync()
    {
        var settings = await LoadGaSettingsAsync();
        var status = await LoadStatusAsync();
        return new AnalyticsSyncStatusResponse
        {
            Configured = await _googleProvider.IsConfiguredAsync(),
            AutoSyncEnabled = settings.AutoSyncEnabled,
            AutoSyncTime = settings.AutoSyncTime,
            AutoSyncDays = settings.AutoSyncDays,
            LastRunUtc = status.LastRunUtc,
            LastSuccess = status.LastSuccess,
            LastSuccessUtc = status.LastSuccessUtc,
            LastMessage = status.LastMessage,
            LastTrigger = status.LastTrigger,
            LastDays = status.LastDays,
        };
    }

    private async Task<GoogleAnalyticsSettingsDto> LoadGaSettingsAsync()
    {
        var result = await _settingService.GetSettingAsync<GoogleAnalyticsSettingsDto>(GaSettingsKey);
        return result.IsSuccess && result.Data != null ? result.Data : new GoogleAnalyticsSettingsDto();
    }

    private async Task<AnalyticsSyncStatusDto> LoadStatusAsync()
    {
        var result = await _settingService.GetSettingAsync<AnalyticsSyncStatusDto>(SyncStatusKey);
        return result.IsSuccess && result.Data != null ? result.Data : new AnalyticsSyncStatusDto();
    }

    private Task SaveStatusAsync(AnalyticsSyncStatusDto status) => _settingService.UpdateSettingAsync(SyncStatusKey, status);

    /// <summary>每次同步（手動或自動）結束後記錄結果；失敗的原因也留下來，讓儀表板看得到</summary>
    private async Task RecordRunAsync(Result result, int days, string trigger)
    {
        try
        {
            var status = await LoadStatusAsync();
            var now = DateTime.UtcNow;
            status.LastRunUtc = now;
            status.LastSuccess = result.IsSuccess;
            status.LastMessage = result.IsSuccess ? $"已同步最近 {days} 天" : result.Error;
            status.LastTrigger = trigger;
            status.LastDays = days;
            if (result.IsSuccess) status.LastSuccessUtc = now;
            await SaveStatusAsync(status);
        }
        catch
        {
            // 記錄狀態失敗不影響同步本身的結果
        }
    }

    private async Task<Result> SyncCoreAsync(int daysToSync)
    {
        // Google Analytics 數據通常會有延遲，我們預設同步「昨天」之前的數據
        // 如果 daysToSync = 1，代表同步昨天；「昨天」用台灣時間算（GA 資源通常是台灣時區，UTC 的昨天會少抓一天）
        var endDate = DateOnly.FromDateTime(DateTime.UtcNow.Add(TaiwanOffset).AddDays(-1));
        var startDate = endDate.AddDays(-daysToSync + 1);

        // 如果要同步更多天，確保 startDate 不會超過 endDate
        if (startDate > endDate) startDate = endDate;

        try
        {
            // 1. 從 Google 抓取數據 (基礎指標)
            var googleData = await _googleProvider.FetchAnalyticsDataAsync(startDate, endDate);

            if (googleData != null && googleData.Any())
            {
                foreach (var item in googleData)
                {
                    var existingRecord = await _unitOfWork.Analytics.GetByDateAsync(item.Date);

                    if (existingRecord != null)
                    {
                        existingRecord.ActiveUsers = item.ActiveUsers;
                        existingRecord.NewUsers = item.NewUsers;
                        existingRecord.ScreenPageViews = item.ScreenPageViews;
                        existingRecord.Sessions = item.Sessions;
                        existingRecord.AverageEngagementTime = item.AverageEngagementTime;
                        existingRecord.EventCount = item.EventCount;
                        existingRecord.BounceRate = item.BounceRate;
                        existingRecord.ScreenPageViewsPerSession = item.ScreenPageViewsPerSession;
                        existingRecord.UpdatedTime = DateTime.UtcNow;
                        
                        await _unitOfWork.Analytics.UpdateAsync(existingRecord);
                    }
                    else
                    {
                        await _unitOfWork.Analytics.AddAsync(item);
                    }
                }
            }

            // 2. 從 Google 抓取維度數據 (分佈圖表)
            var dimensionData = await _googleProvider.FetchDimensionStatisticsAsync(startDate, endDate);
            
            if (dimensionData != null && dimensionData.Any())
            {
                foreach (var dim in dimensionData)
                {
                    var existingDim = await _unitOfWork.Analytics.GetDimensionAsync(dim.Date, dim.DimensionType, dim.DimensionValue);

                    if (existingDim != null)
                    {
                        existingDim.MetricValue = dim.MetricValue;
                        existingDim.UpdatedTime = DateTime.UtcNow;
                        await _unitOfWork.Analytics.UpdateDimensionAsync(existingDim);
                    }
                    else
                    {
                        await _unitOfWork.Analytics.AddDimensionAsync(dim);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
        catch (Exception ex)
        {
            // 在此架構中，通常由 Middleware 處理例外，但業務邏輯也可以回傳 Failure Result
            return Result.Failure($"Sync failed: {ex.Message}");
        }
    }

    public async Task<Result<AnalyticsReportDto>> GetAnalyticsReportAsync(DateOnly startDate, DateOnly endDate)
    {
        // 1. 獲取每日基礎指標
        var dailyData = await _unitOfWork.Analytics.GetByDateRangeAsync(startDate, endDate);
        
        var dailyDtos = dailyData.Select(x => new AnalyticsDailyMetricDto
        {
            Date = x.Date,
            ActiveUsers = x.ActiveUsers,
            NewUsers = x.NewUsers,
            ScreenPageViews = x.ScreenPageViews,
            Sessions = x.Sessions,
            AverageEngagementTime = x.AverageEngagementTime,
            BounceRate = x.BounceRate,
            ScreenPageViewsPerSession = x.ScreenPageViewsPerSession,
            EventCount = x.EventCount
        }).ToList();

        // 2. 獲取維度分佈並聚合
        var dimData = await _unitOfWork.Analytics.GetDimensionsByDateRangeAsync(startDate, endDate);

        // 聚合：將這段期間內相同維度值的數據加總 (例如：這30天來自 Mobile 的總人數)
        // 注意：Active Users 直接加總在 GA 中其實不完全準確 (因為同一人可能跨天)，但在這裡作為趨勢參考是可以的
        var distributions = dimData
            .GroupBy(x => new { x.DimensionType, x.DimensionValue })
            .Select(g => new DimensionStatisticDto
            {
                DimensionType = g.Key.DimensionType,
                DimensionValue = g.Key.DimensionValue,
                TotalUsers = g.Sum(x => x.MetricValue)
            })
            .OrderByDescending(x => x.TotalUsers) // 預設依人數排序
            .ToList();

        return Result<AnalyticsReportDto>.Success(new AnalyticsReportDto
        {
            DailyMetrics = dailyDtos,
            Distributions = distributions
        });
    }
}
