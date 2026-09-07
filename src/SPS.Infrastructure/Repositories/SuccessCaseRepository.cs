using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class SuccessCaseRepository : Repository<SuccessCase, int>, ISuccessCaseRepository
{
    public SuccessCaseRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<SuccessCase>> GetByIndustryAsync(string industry)
    {
        return await _dbSet
            .Where(sc => sc.Industry == industry)
            .OrderByDescending(sc => sc.PublishedDate)
            .ToListAsync();
    }

    public async Task<List<SuccessCase>> GetByTagAsync(string tag)
    {
        return await _dbSet
            .Where(sc => sc.Tags != null && sc.Tags.Contains(tag))
            .OrderByDescending(sc => sc.PublishedDate)
            .ToListAsync();
    }

    public async Task<List<SuccessCase>> GetPublishedAsync()
    {
        return await _dbSet
            .Where(sc => sc.IsPublished)
            .OrderByDescending(sc => sc.PublishedDate)
            .ToListAsync();
    }

    public async Task IncrementViewCountAsync(int id)
    {
        var successCase = await _dbSet.FindAsync(id);
        if (successCase != null)
        {
            successCase.ViewCount++;
            await _context.SaveChangesAsync();
        }
    }
}
