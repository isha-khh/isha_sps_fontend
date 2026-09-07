using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.SiteCounter;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;

namespace SPS.Application.Services;

/// <summary>
/// 網站計數器服務實現
/// </summary>
public class SiteCounterService : ISiteCounterService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SiteCounterService> _logger;

    public SiteCounterService(
        IUnitOfWork unitOfWork,
        ILogger<SiteCounterService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<SiteCounterResponse>> GetCounterAsync(CancellationToken cancellationToken = default)
    {
        var counter = await _unitOfWork.SiteCounter.GetCounterAsync(cancellationToken);

        return Result<SiteCounterResponse>.Success(new SiteCounterResponse
        {
            TotalVisitors = counter.TotalVisitors,
            TotalPageViews = counter.TotalPageViews
        });
    }

    public async Task<Result<SiteCounterResponse>> RecordVisitAsync(bool isNewVisitor, CancellationToken cancellationToken = default)
    {
        var counter = isNewVisitor
            ? await _unitOfWork.SiteCounter.IncrementBothAsync(cancellationToken)
            : await _unitOfWork.SiteCounter.IncrementPageViewAsync(cancellationToken);

        _logger.LogDebug("Recorded visit: NewVisitor={IsNewVisitor}, TotalVisitors={TotalVisitors}, TotalPageViews={TotalPageViews}",
            isNewVisitor, counter.TotalVisitors, counter.TotalPageViews);

        return Result<SiteCounterResponse>.Success(new SiteCounterResponse
        {
            TotalVisitors = counter.TotalVisitors,
            TotalPageViews = counter.TotalPageViews
        });
    }

    public async Task<Result<SiteCounterResponse>> SetCounterAsync(long? totalVisitors, long? totalPageViews, CancellationToken cancellationToken = default)
    {
        var counter = await _unitOfWork.SiteCounter.GetCounterAsync(cancellationToken);

        if (totalVisitors.HasValue)
            counter.TotalVisitors = totalVisitors.Value;

        if (totalPageViews.HasValue)
            counter.TotalPageViews = totalPageViews.Value;

        counter.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Site counter updated: TotalVisitors={TotalVisitors}, TotalPageViews={TotalPageViews}",
            counter.TotalVisitors, counter.TotalPageViews);

        return Result<SiteCounterResponse>.Success(new SiteCounterResponse
        {
            TotalVisitors = counter.TotalVisitors,
            TotalPageViews = counter.TotalPageViews
        });
    }
}
