using System.Text.Json;
using SPS.Application.Interfaces;
using SPS.Domain.Entities;
using StackExchange.Redis;

namespace SPS.Infrastructure.Services;

/// <summary>
/// Redis 服务实现
/// </summary>
public class ChatRedisService : IChatRedisService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private const string SessionPrefix = "session:";
    private const string ConnectionPrefix = "connection:";
    private const string OnlineSessionsKey = "online_sessions";
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromHours(24);

    public ChatRedisService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();
    }

    public async Task<bool> SetUserSessionAsync(UserSession session, TimeSpan? expiry = null)
    {
        var key = $"{SessionPrefix}{session.SessionId}";
        var json = JsonSerializer.Serialize(session);
        var result = await _db.StringSetAsync(key, json, expiry ?? DefaultExpiry);

        if (result && session.IsOnline)
        {
            await _db.SetAddAsync(OnlineSessionsKey, session.SessionId);
        }

        return result;
    }

    public async Task<UserSession?> GetUserSessionAsync(string sessionId)
    {
        var key = $"{SessionPrefix}{sessionId}";
        var json = await _db.StringGetAsync(key);

        if (json.IsNullOrEmpty)
            return null;

        return JsonSerializer.Deserialize<UserSession>(json!.ToString());
    }

    public async Task<bool> DeleteUserSessionAsync(string sessionId)
    {
        var key = $"{SessionPrefix}{sessionId}";
        await _db.SetRemoveAsync(OnlineSessionsKey, sessionId);
        return await _db.KeyDeleteAsync(key);
    }

    public async Task<List<UserSession>> GetAllOnlineSessionsAsync()
    {
        var sessionIds = await _db.SetMembersAsync(OnlineSessionsKey);
        var sessions = new List<UserSession>();

        foreach (var sessionId in sessionIds)
        {
            var session = await GetUserSessionAsync(sessionId!);
            if (session != null && session.IsOnline)
            {
                sessions.Add(session);
            }
        }

        return sessions;
    }

    public async Task<bool> UpdateUserPageAsync(string sessionId, string url, string? title)
    {
        var session = await GetUserSessionAsync(sessionId);
        if (session == null)
            return false;

        session.CurrentUrl = url;
        session.PageTitle = title;
        session.LastActiveTime = DateTime.UtcNow;

        return await SetUserSessionAsync(session);
    }

    public async Task<bool> UpdateUserActivityAsync(string sessionId)
    {
        var session = await GetUserSessionAsync(sessionId);
        if (session == null)
            return false;

        session.LastActiveTime = DateTime.UtcNow;
        return await SetUserSessionAsync(session);
    }

    public async Task<bool> SetUserOfflineAsync(string sessionId)
    {
        var session = await GetUserSessionAsync(sessionId);
        if (session == null)
            return false;

        session.IsOnline = false;
        session.DisconnectedTime = DateTime.UtcNow;
        await _db.SetRemoveAsync(OnlineSessionsKey, sessionId);

        return await SetUserSessionAsync(session, TimeSpan.FromHours(1)); // 保留1小时后自动清理
    }

    public async Task<string?> GetSessionIdByConnectionIdAsync(string connectionId)
    {
        var key = $"{ConnectionPrefix}{connectionId}";
        var sessionId = await _db.StringGetAsync(key);
        return sessionId.IsNullOrEmpty ? null : sessionId.ToString();
    }

    public async Task<bool> SetConnectionMappingAsync(string connectionId, string sessionId)
    {
        var key = $"{ConnectionPrefix}{connectionId}";
        return await _db.StringSetAsync(key, sessionId, TimeSpan.FromHours(24));
    }

    public async Task<bool> DeleteConnectionMappingAsync(string connectionId)
    {
        var key = $"{ConnectionPrefix}{connectionId}";
        return await _db.KeyDeleteAsync(key);
    }
}