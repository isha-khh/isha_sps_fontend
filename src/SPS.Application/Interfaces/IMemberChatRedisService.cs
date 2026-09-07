namespace SPS.Application.Interfaces;

public interface IMemberChatRedisService
{
    Task SetConnectionAsync(string connectionId, Guid entityId, string userType);
    Task RemoveConnectionAsync(string connectionId);
    Task<(Guid entityId, string userType)?> GetConnectionInfoAsync(string connectionId);
    Task SetOnlineAsync(Guid entityId, string userType, string connectionId);
    Task SetOfflineAsync(string connectionId);
    Task<bool> IsOnlineAsync(Guid entityId, string userType);
    Task<List<string>> GetConnectionIdsAsync(Guid entityId, string userType);
    Task<bool> IsAnyOnlineAsync(IEnumerable<Guid> entityIds, string userType);
}
