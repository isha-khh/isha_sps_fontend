using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

public class FidoCredentialRepository : Repository<FidoCredential, Guid>, IFidoCredentialRepository
{
    public FidoCredentialRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<FidoCredential?> GetByCredentialIdAsync(byte[] credentialId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(f => f.Member)
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.CredentialId == credentialId, cancellationToken);
    }

    public async Task<List<FidoCredential>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.CredentialType == "Member" && f.MemberId == memberId)
            .OrderByDescending(f => f.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<FidoCredential>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.CredentialType == "User" && f.UserId == userId)
            .OrderByDescending(f => f.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByCredentialIdAsync(byte[] credentialId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(f => f.CredentialId == credentialId, cancellationToken);
    }
}
