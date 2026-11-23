using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IPasswordHistoryRepository : IRepository<PasswordHistory, Guid>
{
    /// <summary>取得某個會員最近 count 筆密碼歷史（新的在前）</summary>
    Task<List<PasswordHistory>> GetRecentByMemberAsync(Guid memberId, int count, CancellationToken cancellationToken = default);

    /// <summary>取得某個後台使用者最近 count 筆密碼歷史（新的在前）</summary>
    Task<List<PasswordHistory>> GetRecentByUserAsync(Guid userId, int count, CancellationToken cancellationToken = default);
}
