using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 網站統計數據 Repository 實現
/// </summary>
public class SiteStatisticsRepository : ISiteStatisticsRepository
{
    private readonly ApplicationDbContext _context;

    public SiteStatisticsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SiteStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var statistics = await _context.SiteStatistics.FirstOrDefaultAsync(cancellationToken);

        if (statistics == null)
        {
            statistics = new SiteStatistics
            {
                TotalMembers = 0,
                SuccessfulMatches = 0,
                SubsidyApplications = 0,
                CreatedTime = DateTime.UtcNow
            };
            _context.SiteStatistics.Add(statistics);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return statistics;
    }

    public async Task UpdateAsync(SiteStatistics statistics, CancellationToken cancellationToken = default)
    {
        statistics.UpdatedTime = DateTime.UtcNow;
        _context.SiteStatistics.Update(statistics);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
