using System.Text.Json;
using SPS.Application.Interfaces;
using StackExchange.Redis;

namespace SPS.Infrastructure.Services;

public class MemberChatRedisService : IMemberChatRedisService
{
    private readonly IDatabase _db;
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromHours(24);

    private static string ConnKey(string connectionId) => $"memberhub:conn:{connectionId}";
    private static string ConnectionsKey(string userType, Guid entityId) => $"memberhub:connections:{userType}:{entityId}";

    public MemberChatRedisService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    public async Task SetConnectionAsync(string connectionId, Guid entityId, string userType)
    {
        var json = JsonSerializer.Serialize(new { entityId, userType });
        await _db.StringSetAsync(ConnKey(connectionId), json, DefaultExpiry);
    }

    public async Task RemoveConnectionAsync(string connectionId)
    {
        var info = await GetConnectionInfoAsync(connectionId);
        if (info.HasValue)
        {
            var setKey = ConnectionsKey(info.Value.userType, info.Value.entityId);
            await _db.SetRemoveAsync(setKey, connectionId);
        }
        await _db.KeyDeleteAsync(ConnKey(connectionId));
    }

    public async Task<(Guid entityId, string userType)?> GetConnectionInfoAsync(string connectionId)
    {
        var json = await _db.StringGetAsync(ConnKey(connectionId));
        if (json.IsNullOrEmpty) return null;

        var doc = JsonDocument.Parse(json!.ToString());
        var entityId = doc.RootElement.GetProperty("entityId").GetGuid();
        var userType = doc.RootElement.GetProperty("userType").GetString()!;
        return (entityId, userType);
    }

    public async Task SetOnlineAsync(Guid entityId, string userType, string connectionId)
    {
        var setKey = ConnectionsKey(userType, entityId);
        await _db.SetAddAsync(setKey, connectionId);
        await _db.KeyExpireAsync(setKey, DefaultExpiry);
    }

    public async Task SetOfflineAsync(string connectionId)
    {
        var info = await GetConnectionInfoAsync(connectionId);
        if (info.HasValue)
        {
            var setKey = ConnectionsKey(info.Value.userType, info.Value.entityId);
            await _db.SetRemoveAsync(setKey, connectionId);
        }
    }

    public async Task<bool> IsOnlineAsync(Guid entityId, string userType)
    {
        var setKey = ConnectionsKey(userType, entityId);
        var length = await _db.SetLengthAsync(setKey);
        return length > 0;
    }

    public async Task<List<string>> GetConnectionIdsAsync(Guid entityId, string userType)
    {
        var setKey = ConnectionsKey(userType, entityId);
        var members = await _db.SetMembersAsync(setKey);
        return members.Select(m => m.ToString()).ToList();
    }

    public async Task<bool> IsAnyOnlineAsync(IEnumerable<Guid> entityIds, string userType)
    {
        foreach (var entityId in entityIds)
        {
            if (await IsOnlineAsync(entityId, userType))
                return true;
        }
        return false;
    }
}
