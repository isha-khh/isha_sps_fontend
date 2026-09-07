using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class MouRepository : Repository<Mou, int>, IMouRepository
{
    public MouRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Mou>> GetByCompanyIdAsync(Guid companyId)
    {
        return await _dbSet
            .Where(m => m.CompanyId == companyId)
            .Include(m => m.Company)
            .OrderByDescending(m => m.CreatedTime)
            .ToListAsync();
    }
}
