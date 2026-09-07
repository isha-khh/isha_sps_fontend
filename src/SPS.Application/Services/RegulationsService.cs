using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Regulations;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class RegulationsService : IRegulationsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RegulationsService> _logger;

    public RegulationsService(IUnitOfWork unitOfWork, ILogger<RegulationsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<RegulationsResponse>>> GetPagedAsync(
        RegulationsQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Regulations.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<RegulationsResponse>
        {
            Items = pagedResult.Items.Select(MapToResponse).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<RegulationsResponse>>.Success(response);
    }

    public async Task<Result<RegulationsResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var regulations = await _unitOfWork.Regulations.GetByIdAsync(id, cancellationToken);
        if (regulations == null)
            return Result<RegulationsResponse>.Failure("法規不存在");

        return Result<RegulationsResponse>.Success(MapToResponse(regulations));
    }

    public async Task<Result<List<RegulationsResponse>>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default)
    {
        var regulations = await _unitOfWork.Regulations.GetByTypeAsync(type, cancellationToken);
        var response = regulations.Select(MapToResponse).ToList();
        return Result<List<RegulationsResponse>>.Success(response);
    }

    public async Task<Result<List<RegulationsResponse>>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default)
    {
        var regulations = await _unitOfWork.Regulations.GetByCategoryAsync(categoryId, cancellationToken);
        var response = regulations.Select(MapToResponse).ToList();
        return Result<List<RegulationsResponse>>.Success(response);
    }

    public async Task<Result<RegulationsResponse>> CreateAsync(
        CreateRegulationsRequest request,
        CancellationToken cancellationToken = default)
    {
        // 驗證分類
        if (request.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
            if (category == null)
                return Result<RegulationsResponse>.Failure("分類不存在");
        }

        var regulations = new Regulations
        {
            Name = request.Name,
            Title = request.Title,
            Content = request.Content,
            Published = request.Published,
            Type = request.Type,
            Ordinal = request.Ordinal,
            CategoryId = request.CategoryId,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.Regulations.AddAsync(regulations, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<RegulationsResponse>.Success(MapToResponse(regulations));
    }

    public async Task<Result<RegulationsResponse>> UpdateAsync(
        int id,
        UpdateRegulationsRequest request,
        CancellationToken cancellationToken = default)
    {
        var regulations = await _unitOfWork.Regulations.GetByIdAsync(id, cancellationToken);
        if (regulations == null)
            return Result<RegulationsResponse>.Failure("法規不存在");

        // 驗證分類
        if (request.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
            if (category == null)
                return Result<RegulationsResponse>.Failure("分類不存在");
        }

        if (request.Name != null) regulations.Name = request.Name;
        if (request.Title != null) regulations.Title = request.Title;
        if (request.Content != null) regulations.Content = request.Content;
        if (request.Published.HasValue) regulations.Published = request.Published.Value;
        if (request.Type.HasValue) regulations.Type = request.Type.Value;
        if (request.Ordinal.HasValue) regulations.Ordinal = request.Ordinal.Value;
        if (request.CategoryId.HasValue) regulations.CategoryId = request.CategoryId;
        regulations.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Regulations.UpdateAsync(regulations, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<RegulationsResponse>.Success(MapToResponse(regulations));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var regulations = await _unitOfWork.Regulations.GetByIdAsync(id, cancellationToken);
        if (regulations == null)
            return Result<bool>.Failure("法規不存在");

        await _unitOfWork.Regulations.DeleteAsync(regulations, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private RegulationsResponse MapToResponse(Regulations regulations)
    {
        return new RegulationsResponse
        {
            Id = regulations.Id,
            Name = regulations.Name,
            Title = regulations.Title,
            Content = regulations.Content,
            Published = regulations.Published,
            Type = regulations.Type,
            Ordinal = regulations.Ordinal,
            CategoryId = regulations.CategoryId,
            CategoryName = regulations.Category?.Name,
            CreatedTime = regulations.CreatedTime,
            UpdatedTime = regulations.UpdatedTime
        };
    }
}
