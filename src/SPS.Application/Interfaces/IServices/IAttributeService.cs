using SPS.Application.Common;
using SPS.Application.DTOs.Attribute;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 屬性服務接口
/// </summary>
public interface IAttributeService
{
    /// <summary>
    /// 獲取分頁屬性列表
    /// </summary>
    Task<Result<object>> GetPagedAsync(AttributeQueryParameters parameters);

    /// <summary>
    /// 根據 ID 獲取屬性
    /// </summary>
    Task<Result<AttributeDto>> GetByIdAsync(int id);

    /// <summary>
    /// 根據類型獲取屬性列表
    /// </summary>
    Task<Result<List<AttributeDto>>> GetByTypeAsync(AttributeType type);

    /// <summary>
    /// 創建屬性
    /// </summary>
    Task<Result<AttributeDto>> CreateAsync(CreateAttributeRequest request);

    /// <summary>
    /// 更新屬性
    /// </summary>
    Task<Result<AttributeDto>> UpdateAsync(int id, UpdateAttributeRequest request);

    /// <summary>
    /// 刪除屬性
    /// </summary>
    Task<Result<bool>> DeleteAsync(int id);
}
