using SPS.Domain.Enums;
using AttributeEntity = SPS.Domain.Entities.Attribute;

namespace SPS.Application.Interfaces.IRepositories;

public interface IAttributeRepository : IRepository<AttributeEntity, int>
{
    Task<List<AttributeEntity>> GetByTypeAsync(AttributeType type);
    Task<List<AttributeEntity>> GetByCategoryIdAsync(int categoryId);
}
