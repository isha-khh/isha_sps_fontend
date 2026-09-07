using SPS.Application.Common;

namespace SPS.Application.Interfaces.IServices;

public interface ISystemSettingService
{
    /// <summary>
    /// 獲取指定分類的設定
    /// </summary>
    Task<Result<T>> GetSettingAsync<T>(string category, CancellationToken cancellationToken = default) where T : class, new();

    /// <summary>
    /// 更新指定分類的設定
    /// </summary>
    Task<Result> UpdateSettingAsync<T>(string category, T settings, CancellationToken cancellationToken = default);
}
