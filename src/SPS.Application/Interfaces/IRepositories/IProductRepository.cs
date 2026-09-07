using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Product;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 產品倉儲接口
/// </summary>
public interface IProductRepository : IRepository<Product, int>
{
    /// <summary>
    /// 分頁查詢產品列表
    /// </summary>
    Task<PagedResult<Product>> GetPagedAsync(
        ProductQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取所有產品（無分頁）
    /// </summary>
    Task<List<Product>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據企業ID獲取產品
    /// </summary>
    Task<List<Product>> GetByCompanyIdAsync(
        Guid companyId,
        CancellationToken cancellationToken = default);
}
