using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class AnalyticsRepository : Repository<AnalyticsDailyMetric, int>, IAnalyticsRepository
{
    public AnalyticsRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<AnalyticsDailyMetric>> GetByDateRangeAsync(DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.Date >= startDate && x.Date <= endDate)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<AnalyticsDailyMetric?> GetByDateAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.Date == date, cancellationToken);
    }

    public async Task<List<AnalyticsDimensionStatistic>> GetDimensionsByDateRangeAsync(DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default)
    {
        return await _context.AnalyticsDimensionStatistics
            .Where(x => x.Date >= startDate && x.Date <= endDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<AnalyticsDimensionStatistic?> GetDimensionAsync(DateOnly date, Domain.Enums.AnalyticsDimensionType type, string value, CancellationToken cancellationToken = default)
    {
        return await _context.AnalyticsDimensionStatistics
            .FirstOrDefaultAsync(x => x.Date == date && x.DimensionType == type && x.DimensionValue == value, cancellationToken);
    }

    public async Task AddDimensionAsync(AnalyticsDimensionStatistic entity, CancellationToken cancellationToken = default)
    {
        await _context.AnalyticsDimensionStatistics.AddAsync(entity, cancellationToken);
    }

    public async Task UpdateDimensionAsync(AnalyticsDimensionStatistic entity, CancellationToken cancellationToken = default)
    {
        _context.AnalyticsDimensionStatistics.Update(entity);
        await Task.CompletedTask;
    }
}
