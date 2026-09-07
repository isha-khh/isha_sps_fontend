using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IFidoCredentialRepository : IRepository<FidoCredential, Guid>
{
    Task<FidoCredential?> GetByCredentialIdAsync(byte[] credentialId, CancellationToken cancellationToken = default);
    Task<List<FidoCredential>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<List<FidoCredential>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByCredentialIdAsync(byte[] credentialId, CancellationToken cancellationToken = default);
}
