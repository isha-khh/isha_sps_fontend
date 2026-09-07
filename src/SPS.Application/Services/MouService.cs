using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Mou;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using System.Text.Json;

namespace SPS.Application.Services;

public class MouService : IMouService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MouService> _logger;

    public MouService(IUnitOfWork unitOfWork, ILogger<MouService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<object>> GetPagedAsync(MouQueryParameters parameters)
    {
        try
        {
            var query = _unitOfWork.Mous.GetQueryable();

            if (parameters.CompanyId.HasValue)
                query = query.Where(m => m.CompanyId == parameters.CompanyId.Value);

            if (parameters.Status.HasValue)
                query = query.Where(m => m.Status == parameters.Status.Value);

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.ToLower();
                query = query.Where(m => m.Title.ToLower().Contains(search));
            }

            if (parameters.StartDateFrom.HasValue)
                query = query.Where(m => m.StartDate >= parameters.StartDateFrom.Value);

            if (parameters.StartDateTo.HasValue)
                query = query.Where(m => m.StartDate <= parameters.StartDateTo.Value);

            if (parameters.EndDateFrom.HasValue)
                query = query.Where(m => m.EndDate >= parameters.EndDateFrom.Value);

            if (parameters.EndDateTo.HasValue)
                query = query.Where(m => m.EndDate <= parameters.EndDateTo.Value);

            query = query.OrderByDescending(m => m.CreatedTime);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();

            var result = new PagedResult<MouDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = parameters.Page,
                PageSize = parameters.PageSize
            };

            return Result<object>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged MOUs");
            return Result<object>.Failure($"獲取 MOU 列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<MouDto>> GetByIdAsync(int id)
    {
        try
        {
            var mou = await _unitOfWork.Mous.GetByIdAsync(id);
            if (mou == null)
                return Result<MouDto>.Failure("MOU 不存在");

            var dto = MapToDto(mou);
            return Result<MouDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting MOU by id: {Id}", id);
            return Result<MouDto>.Failure($"獲取 MOU 失敗: {ex.Message}");
        }
    }

    public async Task<Result<MouDto>> CreateAsync(CreateMouRequest request)
    {
        try
        {
            var mou = new Mou
            {
                Title = request.Title,
                CompanyId = request.CompanyId,
                SignDate = request.SignDate,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = request.Status,
                DataMode = DataMode.Normal
            };

            if (request.Attachments != null && request.Attachments.Any())
                mou.Attachments = JsonSerializer.Serialize(request.Attachments);

            await _unitOfWork.Mous.AddAsync(mou);
            await _unitOfWork.SaveChangesAsync();

            var dto = MapToDto(mou);
            return Result<MouDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating MOU");
            return Result<MouDto>.Failure($"創建 MOU 失敗: {ex.Message}");
        }
    }

    public async Task<Result<MouDto>> UpdateAsync(int id, UpdateMouRequest request)
    {
        try
        {
            var mou = await _unitOfWork.Mous.GetByIdAsync(id);
            if (mou == null)
                return Result<MouDto>.Failure("MOU 不存在");

            if (!string.IsNullOrEmpty(request.Title))
                mou.Title = request.Title;
            if (request.CompanyId.HasValue)
                mou.CompanyId = request.CompanyId.Value;
            if (request.SignDate.HasValue)
                mou.SignDate = request.SignDate;
            if (request.StartDate.HasValue)
                mou.StartDate = request.StartDate;
            if (request.EndDate.HasValue)
                mou.EndDate = request.EndDate;
            if (request.Status.HasValue)
                mou.Status = request.Status.Value;
            if (request.Attachments != null)
                mou.Attachments = JsonSerializer.Serialize(request.Attachments);

            _unitOfWork.Mous.Update(mou);
            await _unitOfWork.SaveChangesAsync();

            var dto = MapToDto(mou);
            return Result<MouDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating MOU: {Id}", id);
            return Result<MouDto>.Failure($"更新 MOU 失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var mou = await _unitOfWork.Mous.GetByIdAsync(id);
            if (mou == null)
                return Result<bool>.Failure("MOU 不存在");

            _unitOfWork.Mous.Remove(mou);
            await _unitOfWork.SaveChangesAsync();

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting MOU: {Id}", id);
            return Result<bool>.Failure($"刪除 MOU 失敗: {ex.Message}");
        }
    }

    public async Task<Result<MouDto>> UpdateStatusAsync(int id, MouStatus status)
    {
        try
        {
            var mou = await _unitOfWork.Mous.GetByIdAsync(id);
            if (mou == null)
                return Result<MouDto>.Failure("MOU 不存在");

            mou.Status = status;
            _unitOfWork.Mous.Update(mou);
            await _unitOfWork.SaveChangesAsync();

            var dto = MapToDto(mou);
            return Result<MouDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating MOU status: {Id}", id);
            return Result<MouDto>.Failure($"更新 MOU 狀態失敗: {ex.Message}");
        }
    }

    public async Task<Result<MouStatisticsDto>> GetStatisticsAsync()
    {
        try
        {
            var query = _unitOfWork.Mous.GetQueryable();
            var allMous = await query.ToListAsync();

            var statistics = new MouStatisticsDto
            {
                TotalMous = allMous.Count,
                ActiveMous = allMous.Count(m => m.Status == MouStatus.Active),
                ExpiredMous = allMous.Count(m => m.Status == MouStatus.Expired),
                DraftMous = allMous.Count(m => m.Status == MouStatus.Draft)
            };

            return Result<MouStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting MOU statistics");
            return Result<MouStatisticsDto>.Failure($"獲取 MOU 統計失敗: {ex.Message}");
        }
    }

    private static MouDto MapToDto(Mou mou)
    {
        List<string>? attachments = null;
        if (!string.IsNullOrEmpty(mou.Attachments))
        {
            try
            {
                attachments = JsonSerializer.Deserialize<List<string>>(mou.Attachments);
            }
            catch { }
        }

        return new MouDto
        {
            Id = mou.Id,
            Title = mou.Title,
            CompanyId = mou.CompanyId,
            SignDate = mou.SignDate,
            StartDate = mou.StartDate,
            EndDate = mou.EndDate,
            Status = mou.Status,
            Attachments = attachments,
            CreatedTime = mou.CreatedTime,
            UpdatedTime = mou.UpdatedTime
        };
    }
}
