using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 多語言文本倉儲實現
/// </summary>
public class MultilingualTextRepository : Repository<MultilingualText, int>, IMultilingualTextRepository
{
    public MultilingualTextRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<MultilingualText?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(mt => mt.StringResources)
            .FirstOrDefaultAsync(mt => mt.Id == id, cancellationToken);
    }

    public async Task<MultilingualText> CreateTextAsync(
        string defaultText,
        CancellationToken cancellationToken = default)
    {
        var multilingualText = new MultilingualText
        {
            DefaultText = defaultText,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _dbSet.AddAsync(multilingualText, cancellationToken);
        return multilingualText;
    }
}
