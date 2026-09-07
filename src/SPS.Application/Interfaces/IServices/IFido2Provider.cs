using Fido2NetLib;
using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// FIDO2 設定提供者介面（DB 優先、環境變數兜底）
/// </summary>
public interface IFido2Provider
{
    /// <summary>
    /// 取得快取的 IFido2 實例（設定變更時自動重建）
    /// </summary>
    Task<IFido2> GetFido2Async(CancellationToken ct = default);

    /// <summary>
    /// 取得合併後的 FIDO2 設定（DB 優先、IConfiguration 兜底）
    /// </summary>
    Task<Fido2SettingsDto> GetEffectiveSettingsAsync(CancellationToken ct = default);

    /// <summary>
    /// 清除快取（設定更新後呼叫）
    /// </summary>
    void InvalidateCache();
}
