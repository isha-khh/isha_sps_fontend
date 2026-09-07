namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 倉儲基接口
/// </summary>
/// <typeparam name="TEntity">實體類型</typeparam>
/// <typeparam name="TKey">主鍵類型</typeparam>
public interface IRepository<TEntity, TKey> where TEntity : class
{
    /// <summary>
    /// 根據ID獲取實體
    /// </summary>
    Task<TEntity?> GetByIdAsync(TKey id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 添加實體
    /// </summary>
    Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新實體
    /// </summary>
    Task UpdateAsync(TEntity entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除實體
    /// </summary>
    Task DeleteAsync(TEntity entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取可查詢對象
    /// </summary>
    IQueryable<TEntity> GetQueryable();

    /// <summary>
    /// 更新實體（同步）
    /// </summary>
    void Update(TEntity entity);

    /// <summary>
    /// 刪除實體（同步）
    /// </summary>
    void Remove(TEntity entity);
}
