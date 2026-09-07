using SPS.Application.Common;
using SPS.Application.DTOs.Analytics;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGoogleAnalyticsProvider _googleProvider;

    public AnalyticsService(IUnitOfWork unitOfWork, IGoogleAnalyticsProvider googleProvider)
    {
        _unitOfWork = unitOfWork;
        _googleProvider = googleProvider;
    }

    public async Task<Result> SyncAnalyticsDataAsync(int daysToSync = 1)
    {
        // Google Analytics 數據通常會有延遲，我們預設同步「昨天」之前的數據
        // 如果 daysToSync = 1，代表同步昨天
        var endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
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
