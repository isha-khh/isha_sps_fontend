using SPS.Application.Common;
using SPS.Application.DTOs.Mou;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

public interface IMouService
{
    Task<Result<object>> GetPagedAsync(MouQueryParameters parameters);
    Task<Result<MouDto>> GetByIdAsync(int id);
    Task<Result<MouDto>> CreateAsync(CreateMouRequest request);
    Task<Result<MouDto>> UpdateAsync(int id, UpdateMouRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<MouDto>> UpdateStatusAsync(int id, MouStatus status);
    Task<Result<MouStatisticsDto>> GetStatisticsAsync();
}
