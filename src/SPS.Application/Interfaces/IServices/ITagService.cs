using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Tag;

namespace SPS.Application.Interfaces.IServices;

public interface ITagService
{
    Task<Result<PagedResult<TagResponse>>> GetPagedAsync(TagQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<Result<TagResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<TagResponse>> CreateAsync(CreateTagRequest request, CancellationToken cancellationToken = default);
    Task<Result<TagResponse>> UpdateAsync(int id, UpdateTagRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}