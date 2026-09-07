using SPS.Application.Common;
using SPS.Application.DTOs.SuccessCase;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 成功案例服務接口
/// </summary>
public interface ISuccessCaseService
{
    /// <summary>
    /// 獲取分頁成功案例列表
    /// </summary>
    Task<Result<object>> GetPagedAsync(SuccessCaseQueryParameters parameters);

    /// <summary>
    /// 根據 ID 獲取成功案例
    /// </summary>
    Task<Result<SuccessCaseDto>> GetByIdAsync(int id);

    /// <summary>
    /// 創建成功案例
    /// </summary>
    Task<Result<SuccessCaseDto>> CreateAsync(CreateSuccessCaseRequest request);

    /// <summary>
    /// 更新成功案例
    /// </summary>
    Task<Result<SuccessCaseDto>> UpdateAsync(int id, UpdateSuccessCaseRequest request);

    /// <summary>
    /// 刪除成功案例
    /// </summary>
    Task<Result<bool>> DeleteAsync(int id);

    /// <summary>
    /// 更新發布狀態
    /// </summary>
    Task<Result<SuccessCaseDto>> UpdatePublishStatusAsync(int id, bool isPublished);

    /// <summary>
    /// 增加瀏覽次數
    /// </summary>
    Task<Result<bool>> IncrementViewCountAsync(int id);

    /// <summary>
    /// 獲取統計數據
    /// </summary>
    Task<Result<SuccessCaseStatisticsDto>> GetStatisticsAsync();
}
