using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IMouRepository : IRepository<Mou, int>
{
    Task<List<Mou>> GetByCompanyIdAsync(Guid companyId);
}
