using SPS.Domain.Entities;

namespace SPS.Application.Interfaces;

/// <summary>
/// 聊天系統 Redis 服務接口
/// </summary>
public interface IChatRedisService
{
    /// <summary>
    /// 存儲用戶會話到 Redis
    /// </summary>
    Task<bool> SetUserSessionAsync(UserSession session, TimeSpan? expiry = null);

    /// <summary>
    /// 從 Redis 獲取用戶會話
    /// </summary>
    Task<UserSession?> GetUserSessionAsync(string sessionId);

    /// <summary>
    /// 刪除用戶會話
    /// </summary>
    Task<bool> DeleteUserSessionAsync(string sessionId);

    /// <summary>
    /// 獲取所有在線用戶會話
    /// </summary>
    Task<List<UserSession>> GetAllOnlineSessionsAsync();

    /// <summary>
    /// 更新用戶當前頁面
    /// </summary>
    Task<bool> UpdateUserPageAsync(string sessionId, string url, string? title);

    /// <summary>
    /// 更新用戶活躍時間
    /// </summary>
    Task<bool> UpdateUserActivityAsync(string sessionId);

    /// <summary>
    /// 設置用戶為離線狀態
    /// </summary>
    Task<bool> SetUserOfflineAsync(string sessionId);

    /// <summary>
    /// 通過 ConnectionId 獲取 SessionId
    /// </summary>
    Task<string?> GetSessionIdByConnectionIdAsync(string connectionId);

    /// <summary>
    /// 存儲 ConnectionId 到 SessionId 的映射
    /// </summary>
    Task<bool> SetConnectionMappingAsync(string connectionId, string sessionId);

    /// <summary>
    /// 刪除 ConnectionId 映射
    /// </summary>
    Task<bool> DeleteConnectionMappingAsync(string connectionId);
}