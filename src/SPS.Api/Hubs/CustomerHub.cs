using Microsoft.AspNetCore.SignalR;
using SPS.Application.Interfaces;
using SPS.Domain.Entities;
using System.Text.Json;

namespace SPS.Api.Hubs;

/// <summary>
/// 客服聊天 Hub
/// </summary>
public class CustomerHub : Hub
{
    private readonly IChatRedisService _redisService;
    private readonly IChatPersistenceService _persistenceService;
    private readonly ILogger<CustomerHub> _logger;

    public CustomerHub(
        IChatRedisService redisService,
        IChatPersistenceService persistenceService,
        ILogger<CustomerHub> logger)
    {
        _redisService = redisService;
        _persistenceService = persistenceService;
        _logger = logger;
    }

    /// <summary>
    /// 客戶端連接時觸發
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        try
        {
            var httpContext = Context.GetHttpContext();
            if (httpContext == null)
            {
                _logger.LogWarning("HttpContext is null for connection {ConnectionId}", Context.ConnectionId);
                await base.OnConnectedAsync();
                return;
            }

            // 從 QueryString 獲取參數
            var sessionId = httpContext.Request.Query["sessionId"].ToString();
            var gaId = httpContext.Request.Query["gaId"].ToString();
            var utmSource = httpContext.Request.Query["utm_source"].ToString();
            var utmMedium = httpContext.Request.Query["utm_medium"].ToString();
            var utmCampaign = httpContext.Request.Query["utm_campaign"].ToString();

            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning("SessionId is empty for connection {ConnectionId}", Context.ConnectionId);
                await base.OnConnectedAsync();
                return;
            }

            // 獲取客戶端信息
            var userAgent = httpContext.Request.Headers["User-Agent"].ToString();
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();

            // 構建 UTM 標簽
            var utmTags = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(utmSource)) utmTags["source"] = utmSource;
            if (!string.IsNullOrEmpty(utmMedium)) utmTags["medium"] = utmMedium;
            if (!string.IsNullOrEmpty(utmCampaign)) utmTags["campaign"] = utmCampaign;

            // 檢查是否已存在會話
            var existingSession = await _redisService.GetUserSessionAsync(sessionId);

            if (existingSession != null)
            {
                // 更新現有會話
                existingSession.ConnectionId = Context.ConnectionId;
                existingSession.IsOnline = true;
                existingSession.LastActiveTime = DateTime.UtcNow;
                await _redisService.SetUserSessionAsync(existingSession);

                _logger.LogInformation("Existing session reconnected: {SessionId}", sessionId);
            }
            else
            {
                // 創建新會話
                var session = new UserSession
                {
                    Id = sessionId,
                    SessionId = sessionId,
                    ConnectionId = Context.ConnectionId,
                    GaClientId = gaId,
                    IsOnline = true,
                    FirstConnectedTime = DateTime.UtcNow,
                    LastActiveTime = DateTime.UtcNow,
                    UserAgent = userAgent,
                    IpAddress = ipAddress,
                    UtmTags = utmTags.Count > 0 ? JsonSerializer.Serialize(utmTags) : null,
                    Status = "active"
                };

                // 存儲到 Redis 和 DB
                await _redisService.SetUserSessionAsync(session);

                try
                {
                    await _persistenceService.SaveUserSessionAsync(session);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to save session to DB (non-critical): {SessionId}", sessionId);
                }

                _logger.LogInformation("New session created: {SessionId}", sessionId);
            }

            // 存儲 ConnectionId 映射
            await _redisService.SetConnectionMappingAsync(Context.ConnectionId, sessionId);

            // 推送歷史訊息給重連的訪客
            try
            {
                var history = await _persistenceService.GetMessagesAsync(sessionId, 0, 50);
                if (history.Count > 0)
                {
                    var historyDtos = history.Select(m => new
                    {
                        messageId = m.Id,
                        senderType = m.SenderType,
                        senderName = m.SenderName,
                        content = m.Content,
                        time = m.CreatedTime,
                        senderAvatarUrl = (string?)null
                    }).ToList();

                    await Clients.Caller.SendAsync("ChatHistory", historyDtos);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to push chat history (non-critical): {SessionId}", sessionId);
            }

            // 通知客服端有新用戶上線（使用 camelCase）
            await Clients.Group("Agents").SendAsync("UserConnected", new
            {
                sessionId = sessionId,
                connectionId = Context.ConnectionId,
                gaClientId = gaId,
                time = DateTime.UtcNow
            });

            await base.OnConnectedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnConnectedAsync");
            await base.OnConnectedAsync();
        }
    }

    /// <summary>
    /// 客戶端斷開連接時觸發
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var sessionId = await _redisService.GetSessionIdByConnectionIdAsync(Context.ConnectionId);

            if (!string.IsNullOrEmpty(sessionId))
            {
                // 設置用戶為離線
                await _redisService.SetUserOfflineAsync(sessionId);

                // 更新 DB 中的會話狀態
                try
                {
                    var session = await _persistenceService.GetUserSessionAsync(sessionId);
                    if (session != null)
                    {
                        session.IsOnline = false;
                        session.DisconnectedTime = DateTime.UtcNow;
                        await _persistenceService.UpdateUserSessionAsync(session);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to update session in DB (non-critical): {SessionId}", sessionId);
                }

                // 刪除 ConnectionId 映射
                await _redisService.DeleteConnectionMappingAsync(Context.ConnectionId);

                // 通知客服端用戶離線（使用 camelCase）
                await Clients.Group("Agents").SendAsync("UserDisconnected", new
                {
                    sessionId = sessionId,
                    time = DateTime.UtcNow
                });

                _logger.LogInformation("User disconnected: {SessionId}", sessionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnDisconnectedAsync");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// 更新用戶當前訪問的頁面
    /// </summary>
    public async Task UpdatePageFocus(string url, string? title)
    {
        try
        {
            var sessionId = await _redisService.GetSessionIdByConnectionIdAsync(Context.ConnectionId);

            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning("SessionId not found for connection {ConnectionId}", Context.ConnectionId);
                return;
            }

            // 更新 Redis 中的當前頁面
            await _redisService.UpdateUserPageAsync(sessionId, url, title);

            // 保存頁面瀏覽記錄到 DB
            try
            {
                var pageView = new VisitorPageView
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    Url = url,
                    Title = title,
                    ViewTime = DateTime.UtcNow
                };
                await _persistenceService.SavePageViewAsync(pageView);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save page view to DB (non-critical): {SessionId}", sessionId);
            }

            // 通知客服端用戶頁面變化（使用 camelCase）
            await Clients.Group("Agents").SendAsync("UserActivityUpdated", new
            {
                sessionId = sessionId,
                connectionId = Context.ConnectionId,
                url = url,
                title = title,
                time = DateTime.UtcNow
            });

            _logger.LogInformation("Page updated for session {SessionId}: {Url}", sessionId, url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in UpdatePageFocus");
        }
    }

    /// <summary>
    /// 發送消息給客服
    /// </summary>
    public async Task SendMessageToAgent(string message)
    {
        try
        {
            var sessionId = await _redisService.GetSessionIdByConnectionIdAsync(Context.ConnectionId);

            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning("SessionId not found for connection {ConnectionId}", Context.ConnectionId);
                return;
            }

            // 保存消息到 DB
            var chatMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                SenderType = "visitor",
                SenderName = "訪客",
                Content = message,
                MessageType = "text",
                IsRead = false
            };

            try
            {
                await _persistenceService.SaveMessageAsync(chatMessage);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save message to DB (non-critical): {SessionId}", sessionId);
            }

            // 更新活躍時間
            await _redisService.UpdateUserActivityAsync(sessionId);

            // 發送消息給客服組（使用 camelCase）
            await Clients.Group("Agents").SendAsync("ReceiveMessage", new
            {
                messageId = chatMessage.Id,
                sessionId = sessionId,
                senderType = "visitor",
                senderName = "訪客",
                content = message,
                time = DateTime.UtcNow,
                senderAvatarUrl = (string?)null
            });

            _logger.LogInformation("Message sent from session {SessionId}", sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendMessageToAgent");
        }
    }

    /// <summary>
    /// 客服發送消息給訪客
    /// </summary>
    public async Task SendMessageToVisitor(string sessionId, string message, Guid agentId, string agentName, string? agentAvatarUrl = null)
    {
        try
        {
            // 保存消息到 DB
            var chatMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                SenderId = agentId,
                SenderType = "agent",
                SenderName = agentName,
                Content = message,
                MessageType = "text",
                IsRead = false
            };

            try
            {
                await _persistenceService.SaveMessageAsync(chatMessage);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save message to DB (non-critical): {SessionId}", sessionId);
            }

            // 獲取訪客的會話信息
            var session = await _redisService.GetUserSessionAsync(sessionId);
            if (session?.ConnectionId != null)
            {
                // 發送消息給特定訪客（使用 camelCase）
                await Clients.Client(session.ConnectionId).SendAsync("ReceiveMessage", new
                {
                    messageId = chatMessage.Id,
                    senderType = "agent",
                    senderName = agentName,
                    content = message,
                    time = DateTime.UtcNow,
                    senderAvatarUrl = agentAvatarUrl
                });

                _logger.LogInformation("Message sent from agent {AgentId} to session {SessionId}", agentId, sessionId);
            }
            else
            {
                _logger.LogWarning("Visitor connection not found for session {SessionId}", sessionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendMessageToVisitor");
        }
    }

    /// <summary>
    /// 客服加入客服組
    /// </summary>
    public async Task JoinAgentGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Agents");
        _logger.LogInformation("Agent joined group: {ConnectionId}", Context.ConnectionId);
    }

    /// <summary>
    /// 客服離開客服組
    /// </summary>
    public async Task LeaveAgentGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Agents");
        _logger.LogInformation("Agent left group: {ConnectionId}", Context.ConnectionId);
    }

    /// <summary>
    /// 標記消息為已讀
    /// </summary>
    public async Task MarkMessageAsRead(Guid messageId)
    {
        try
        {
            await _persistenceService.MarkMessageAsReadAsync(messageId);
            _logger.LogInformation("Message marked as read: {MessageId}", messageId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to mark message as read in DB (non-critical): {MessageId}", messageId);
        }
    }
}