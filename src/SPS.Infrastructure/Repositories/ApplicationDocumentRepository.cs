using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 申請文件倉儲實現
/// </summary>
public class ApplicationDocumentRepository : Repository<ApplicationDocument, Guid>, IApplicationDocumentRepository
{
    public ApplicationDocumentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<ApplicationDocument>> GetByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.ApplicationId == applicationId)
            .OrderBy(d => d.Type)
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationDocument?> GetByApplicationIdAndTypeAsync(Guid applicationId, DocumentType type, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(d => d.ApplicationId == applicationId && d.Type == type, cancellationToken);
    }

    public async Task<List<ApplicationDocument>> GetExpiredDocumentsAsync(DateTime expirationDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.ExpiresAt != null && d.ExpiresAt < expirationDate)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        var documents = await _dbSet
            .Where(d => d.ApplicationId == applicationId)
            .ToListAsync(cancellationToken);

        _dbSet.RemoveRange(documents);
    }

    public async Task<List<ApplicationDocument>> GetDocumentsForCleanupAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbSet
            .Include(d => d.UploadedFile)
            .Where(d => d.ExpiresAt != null && d.ExpiresAt < now)
            .ToListAsync(cancellationToken);
    }
}
