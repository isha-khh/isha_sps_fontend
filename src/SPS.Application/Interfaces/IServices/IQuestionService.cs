using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Question;

namespace SPS.Application.Interfaces.IServices;

public interface IQuestionService
{
    Task<Result<PagedResult<QuestionResponse>>> GetPagedAsync(
        QuestionQueryParameters parameters,
        CancellationToken cancellationToken = default);

    Task<Result<QuestionResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Result<List<QuestionResponse>>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default);

    Task<Result<QuestionResponse>> CreateAsync(
        CreateQuestionRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<QuestionResponse>> UpdateAsync(
        int id,
        UpdateQuestionRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
