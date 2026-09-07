using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;
using AttributeEntity = SPS.Domain.Entities.Attribute;

namespace SPS.Infrastructure.Repositories;

public class AttributeRepository : Repository<AttributeEntity, int>, IAttributeRepository
{
    public AttributeRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<AttributeEntity>> GetByTypeAsync(AttributeType type)
    {
        return await _dbSet
            .Where(a => a.Type == type)
            .Include(a => a.Category)
            .OrderBy(a => a.Ordinal)
            .ThenBy(a => a.Id)
            .ToListAsync();
    }

    public async Task<List<AttributeEntity>> GetByCategoryIdAsync(int categoryId)
    {
        return await _dbSet
            .Where(a => a.CategoryId == categoryId)
            .OrderBy(a => a.Ordinal)
            .ThenBy(a => a.Id)
            .ToListAsync();
    }
}
