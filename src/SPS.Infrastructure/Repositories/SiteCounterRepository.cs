using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 網站計數器倉儲實現
/// </summary>
public class SiteCounterRepository : Repository<SiteCounter, int>, ISiteCounterRepository
{
    public SiteCounterRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SiteCounter> GetCounterAsync(CancellationToken cancellationToken = default)
    {
        var counter = await _dbSet.FirstOrDefaultAsync(cancellationToken);

        if (counter == null)
        {
            counter = new SiteCounter
            {
                TotalVisitors = 0,
                TotalPageViews = 0,
                CreatedTime = DateTime.UtcNow
            };
            await _dbSet.AddAsync(counter, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return counter;
    }

    public async Task<SiteCounter> IncrementPageViewAsync(CancellationToken cancellationToken = default)
    {
        var counter = await GetCounterAsync(cancellationToken);
        counter.TotalPageViews++;
        counter.UpdatedTime = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return counter;
    }

    public async Task<SiteCounter> IncrementVisitorAsync(CancellationToken cancellationToken = default)
    {
        var counter = await GetCounterAsync(cancellationToken);
        counter.TotalVisitors++;
        counter.UpdatedTime = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return counter;
    }

    public async Task<SiteCounter> IncrementBothAsync(CancellationToken cancellationToken = default)
    {
        var counter = await GetCounterAsync(cancellationToken);
        counter.TotalVisitors++;
        counter.TotalPageViews++;
        counter.UpdatedTime = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return counter;
    }
}
