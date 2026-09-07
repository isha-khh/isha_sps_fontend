using SPS.Application.DTOs.Chat;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;

namespace SPS.Application.Services;

/// <summary>
/// 聊天服務實現
/// </summary>
public class ChatService : IChatService
{
    private readonly IChatRedisService _redisService;
    private readonly IChatPersistenceService _persistenceService;

    public ChatService(IChatRedisService redisService, IChatPersistenceService persistenceService)
    {
        _redisService = redisService;
        _persistenceService = persistenceService;
    }

    public async Task<List<UserSessionDto>> GetOnlineVisitorsAsync()
    {
        var sessions = await _redisService.GetAllOnlineSessionsAsync();

        var result = new List<UserSessionDto>();
        foreach (var session in sessions)
        {
            // 嘗試獲取未讀數，失敗則使用 0
            var unreadCount = 0;
            try
            {
                unreadCount = await GetUnreadMessageCountAsync(session.SessionId);
            }
            catch (Exception)
            {
                // DB 不可用時忽略錯誤，使用預設值 0
            }

            result.Add(new UserSessionDto
            {
                SessionId = session.SessionId,
                GaClientId = session.GaClientId,
                CurrentUrl = session.CurrentUrl,
                PageTitle = session.PageTitle,
                LastActiveTime = session.LastActiveTime,
                FirstConnectedTime = session.FirstConnectedTime,
                IsOnline = session.IsOnline,
                UtmTags = session.UtmTags,
                UserAgent = session.UserAgent,
                IpAddress = session.IpAddress,
                Status = session.Status,
                UnreadMessageCount = unreadCount
            });
        }

        return result.OrderByDescending(x => x.LastActiveTime).ToList();
    }

    public async Task<UserSessionDto?> GetVisitorSessionAsync(string sessionId)
    {
        var session = await _redisService.GetUserSessionAsync(sessionId);

        if (session == null)
        {
            // 嘗試從 DB 獲取
            try
            {
                session = await _persistenceService.GetUserSessionAsync(sessionId);
            }
            catch (Exception)
            {
                // DB 不可用時忽略
            }

            if (session == null)
                return null;
        }

        // 嘗試獲取未讀數，失敗則使用 0
        var unreadCount = 0;
        try
        {
            unreadCount = await GetUnreadMessageCountAsync(sessionId);
        }
        catch (Exception)
        {
            // DB 不可用時忽略錯誤
        }

        return new UserSessionDto
        {
            SessionId = session.SessionId,
            GaClientId = session.GaClientId,
            CurrentUrl = session.CurrentUrl,
            PageTitle = session.PageTitle,
            LastActiveTime = session.LastActiveTime,
            FirstConnectedTime = session.FirstConnectedTime,
            IsOnline = session.IsOnline,
            UtmTags = session.UtmTags,
            UserAgent = session.UserAgent,
            IpAddress = session.IpAddress,
            Status = session.Status,
            UnreadMessageCount = unreadCount
        };
    }

    public async Task<List<ChatMessageDto>> GetChatHistoryAsync(string sessionId, int skip = 0, int limit = 50)
    {
        try
        {
            var messages = await _persistenceService.GetMessagesAsync(sessionId, skip, limit);

            return messages.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SessionId = m.SessionId,
                SenderId = m.SenderId,
                SenderType = m.SenderType,
                SenderName = m.SenderName,
                Content = m.Content,
                MessageType = m.MessageType,
                IsRead = m.IsRead,
                ReadTime = m.ReadTime,
                CreatedTime = m.CreatedTime
            }).ToList();
        }
        catch (Exception)
        {
            // DB 不可用時返回空列表
            return new List<ChatMessageDto>();
        }
    }

    public async Task<List<VisitorPageViewDto>> GetPageViewHistoryAsync(string sessionId)
    {
        try
        {
            var pageViews = await _persistenceService.GetPageViewsAsync(sessionId);

            return pageViews.Select(p => new VisitorPageViewDto
            {
                Id = p.Id,
                SessionId = p.SessionId,
                Url = p.Url,
                Title = p.Title,
                ViewTime = p.ViewTime,
                DurationSeconds = p.DurationSeconds,
                ReferrerUrl = p.ReferrerUrl
            }).ToList();
        }
        catch (Exception)
        {
            // DB 不可用時返回空列表
            return new List<VisitorPageViewDto>();
        }
    }

    public async Task<int> GetUnreadMessageCountAsync(string sessionId)
    {
        var messages = await _persistenceService.GetMessagesAsync(sessionId, 0, 1000);
        return messages.Count(m => !m.IsRead && m.SenderType == "visitor");
    }

    public async Task<Dictionary<string, int>> GetSessionStatisticsAsync()
    {
        var onlineSessions = await _redisService.GetAllOnlineSessionsAsync();

        var stats = new Dictionary<string, int>
        {
            { "total_online", onlineSessions.Count },
            { "active", onlineSessions.Count(s => s.Status == "active") },
            { "waiting", onlineSessions.Count(s => s.Status == "waiting") },
            { "chatting", onlineSessions.Count(s => s.Status == "chatting") }
        };

        return stats;
    }
}