using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Question;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IQuestionRepository : IRepository<Question, int>
{
    Task<PagedResult<Question>> GetPagedAsync(
        QuestionQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<List<Question>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<List<Question>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default);
}
