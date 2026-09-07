using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Attribute;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using AttributeEntity = SPS.Domain.Entities.Attribute;

namespace SPS.Application.Services;

public class AttributeService : IAttributeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AttributeService> _logger;

    public AttributeService(
        IUnitOfWork unitOfWork,
        ILogger<AttributeService> _logger)
    {
        _unitOfWork = unitOfWork;
        this._logger = _logger;
    }

    public async Task<Result<object>> GetPagedAsync(AttributeQueryParameters parameters)
    {
        try
        {
            var query = _unitOfWork.Attributes.GetQueryable();

            if (parameters.Type.HasValue)
                query = query.Where(a => a.Type == parameters.Type.Value);

            if (parameters.CategoryId.HasValue)
                query = query.Where(a => a.CategoryId == parameters.CategoryId.Value);

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(search) ||
                    (a.Code != null && a.Code.ToLower().Contains(search)));
            }

            if (parameters.Required.HasValue)
                query = query.Where(a => a.Required == parameters.Required.Value);

            query = query.OrderBy(a => a.Ordinal).ThenBy(a => a.Name);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();

            var result = new PagedResult<AttributeDto>
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
            _logger.LogError(ex, "Error getting paged attributes");
            return Result<object>.Failure($"獲取屬性列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<AttributeDto>> GetByIdAsync(int id)
    {
        try
        {
            var attribute = await _unitOfWork.Attributes.GetByIdAsync(id);
            if (attribute == null)
                return Result<AttributeDto>.Failure("屬性不存在");

            var dto = MapToDto(attribute);
            return Result<AttributeDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attribute by id: {Id}", id);
            return Result<AttributeDto>.Failure($"獲取屬性失敗: {ex.Message}");
        }
    }

    public async Task<Result<List<AttributeDto>>> GetByTypeAsync(AttributeType type)
    {
        try
        {
            var attributes = await _unitOfWork.Attributes.GetByTypeAsync(type);
            var dtos = attributes.Select(MapToDto).ToList();
            return Result<List<AttributeDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attributes by type: {Type}", type);
            return Result<List<AttributeDto>>.Failure($"獲取屬性列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<AttributeDto>> CreateAsync(CreateAttributeRequest request)
    {
        try
        {
            var attribute = new AttributeEntity
            {
                Name = request.Name,
                Code = request.Code,
                Description = request.Description,
                Type = request.Type,
                CategoryId = request.CategoryId,
                Ordinal = request.Ordinal,
                Required = request.Required,
                Selectable = request.Selectable,
                Multiple = request.Multiple,
                DataMode = DataMode.Normal
            };

            await _unitOfWork.Attributes.AddAsync(attribute);
            await _unitOfWork.SaveChangesAsync();

            var dto = MapToDto(attribute);
            return Result<AttributeDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating attribute");
            return Result<AttributeDto>.Failure($"創建屬性失敗: {ex.Message}");
        }
    }

    public async Task<Result<AttributeDto>> UpdateAsync(int id, UpdateAttributeRequest request)
    {
        try
        {
            var attribute = await _unitOfWork.Attributes.GetByIdAsync(id);
            if (attribute == null)
                return Result<AttributeDto>.Failure("屬性不存在");

            if (!string.IsNullOrEmpty(request.Name))
                attribute.Name = request.Name;
            if (request.Code != null)
                attribute.Code = request.Code;
            if (request.Description != null)
                attribute.Description = request.Description;
            if (request.Type.HasValue)
                attribute.Type = request.Type.Value;
            if (request.CategoryId.HasValue)
                attribute.CategoryId = request.CategoryId;
            if (request.Ordinal.HasValue)
                attribute.Ordinal = request.Ordinal.Value;
            if (request.Required.HasValue)
                attribute.Required = request.Required.Value;
            if (request.Selectable.HasValue)
                attribute.Selectable = request.Selectable.Value;
            if (request.Multiple.HasValue)
                attribute.Multiple = request.Multiple.Value;

            _unitOfWork.Attributes.Update(attribute);
            await _unitOfWork.SaveChangesAsync();

            var dto = MapToDto(attribute);
            return Result<AttributeDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating attribute: {Id}", id);
            return Result<AttributeDto>.Failure($"更新屬性失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var attribute = await _unitOfWork.Attributes.GetByIdAsync(id);
            if (attribute == null)
                return Result<bool>.Failure("屬性不存在");

            _unitOfWork.Attributes.Remove(attribute);
            await _unitOfWork.SaveChangesAsync();

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting attribute: {Id}", id);
            return Result<bool>.Failure($"刪除屬性失敗: {ex.Message}");
        }
    }

    private static AttributeDto MapToDto(AttributeEntity attribute)
    {
        return new AttributeDto
        {
            Id = attribute.Id,
            Name = attribute.Name,
            Code = attribute.Code,
            Description = attribute.Description,
            Type = attribute.Type,
            CategoryId = attribute.CategoryId,
            Ordinal = attribute.Ordinal,
            IsRequired = attribute.Required,
            Selectable = attribute.Selectable,
            Multiple = attribute.Multiple,
            CreatedTime = attribute.CreatedTime,
            UpdatedTime = attribute.UpdatedTime
        };
    }
}
