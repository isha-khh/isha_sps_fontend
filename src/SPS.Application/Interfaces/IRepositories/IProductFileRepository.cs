namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 產品文件倉儲接口
/// </summary>
public interface IProductFileRepository
{
    /// <summary>
    /// 根據 ID 獲取文件
    /// </summary>
    Task<Domain.Entities.File?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新文件
    /// </summary>
    Task UpdateAsync(Domain.Entities.File file, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據產品 ID 獲取文件列表
    /// </summary>
    Task<List<Domain.Entities.File>> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default);
}
