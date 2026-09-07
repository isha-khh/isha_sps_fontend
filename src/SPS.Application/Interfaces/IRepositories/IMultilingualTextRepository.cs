using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IMultilingualTextRepository : IRepository<MultilingualText, int>
{
    Task<MultilingualText> CreateTextAsync(
        string defaultText,
        CancellationToken cancellationToken = default);
}
