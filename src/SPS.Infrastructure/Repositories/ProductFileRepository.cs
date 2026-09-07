using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 產品文件倉儲實現
/// </summary>
public class ProductFileRepository : IProductFileRepository
{
    private readonly ApplicationDbContext _context;

    public ProductFileRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Domain.Entities.File?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Domain.Entities.File>()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(Domain.Entities.File file, CancellationToken cancellationToken = default)
    {
        _context.Set<Domain.Entities.File>().Update(file);
    }

    public async Task<List<Domain.Entities.File>> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Domain.Entities.File>()
            .Where(f => f.ProductId == productId)
            .ToListAsync(cancellationToken);
    }
}
