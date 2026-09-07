using Dapper;
using Npgsql;
using SPS.Application.Interfaces;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Services;

/// <summary>
/// PostgreSQL 聊天服務實現（替代 MongoDB）
/// </summary>
public class ChatPostgresService : IChatPersistenceService
{
    private readonly string _connectionString;

    public ChatPostgresService(string connectionString)
    {
        _connectionString = connectionString;
    }

    // ==================== 消息管理 ====================

    public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
    {
        const string sql = @"
            INSERT INTO ""ChatMessages""
            (""Id"", ""SessionId"", ""SenderId"", ""SenderType"", ""SenderName"",
             ""Content"", ""MessageType"", ""IsRead"", ""CreatedTime"", ""UpdatedTime"")
            VALUES
            (@Id, @SessionId, @SenderId, @SenderType, @SenderName,
             @Content, @MessageType, @IsRead, @CreatedTime, @UpdatedTime)";

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.ExecuteAsync(sql, new
        {
            message.Id,
            message.SessionId,
            message.SenderId,
            message.SenderType,
            message.SenderName,
            message.Content,
            message.MessageType,
            message.IsRead,
            message.CreatedTime,
            message.UpdatedTime
        });

        return message;
    }

    public async Task<List<ChatMessage>> GetMessagesAsync(string sessionId, int skip = 0, int limit = 50)
    {
        const string sql = @"
            SELECT * FROM ""ChatMessages""
            WHERE ""SessionId"" = @SessionId
            ORDER BY ""CreatedTime""
            OFFSET @Skip LIMIT @Limit";

        using var connection = new NpgsqlConnection(_connectionString);
        var messages = await connection.QueryAsync<ChatMessage>(sql, new { SessionId = sessionId, Skip = skip, Limit = limit });
        return messages.ToList();
    }

    public async Task<bool> MarkMessageAsReadAsync(Guid messageId)
    {
        const string sql = @"
            UPDATE ""ChatMessages""
            SET ""IsRead"" = TRUE, ""ReadTime"" = @ReadTime, ""UpdatedTime"" = @UpdatedTime
            WHERE ""Id"" = @MessageId";

        using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new
        {
            MessageId = messageId,
            ReadTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        });

        return affected > 0;
    }

    // ==================== 會話管理 ====================

    public async Task<UserSession> SaveUserSessionAsync(UserSession session)
    {
        const string sql = @"
            INSERT INTO ""UserSessions""
            (""Id"", ""SessionId"", ""ConnectionId"", ""GaClientId"", ""IsOnline"",
             ""FirstConnectedTime"", ""LastActiveTime"", ""DisconnectedTime"",
             ""UserAgent"", ""IpAddress"", ""UtmTags"", ""Status"",
             ""CurrentUrl"", ""PageTitle"", ""CreatedTime"", ""UpdatedTime"")
            VALUES
            (@Id, @SessionId, @ConnectionId, @GaClientId, @IsOnline,
             @FirstConnectedTime, @LastActiveTime, @DisconnectedTime,
             @UserAgent, @IpAddress, @UtmTags::jsonb, @Status,
             @CurrentUrl, @PageTitle, @CreatedTime, @UpdatedTime)
            ON CONFLICT (""SessionId"")
            DO UPDATE SET
                ""ConnectionId"" = EXCLUDED.""ConnectionId"",
                ""IsOnline"" = EXCLUDED.""IsOnline"",
                ""LastActiveTime"" = EXCLUDED.""LastActiveTime"",
                ""DisconnectedTime"" = EXCLUDED.""DisconnectedTime"",
                ""CurrentUrl"" = EXCLUDED.""CurrentUrl"",
                ""PageTitle"" = EXCLUDED.""PageTitle"",
                ""UpdatedTime"" = EXCLUDED.""UpdatedTime""";

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.ExecuteAsync(sql, new
        {
            session.Id,
            session.SessionId,
            session.ConnectionId,
            session.GaClientId,
            session.IsOnline,
            session.FirstConnectedTime,
            session.LastActiveTime,
            session.DisconnectedTime,
            session.UserAgent,
            session.IpAddress,
            session.UtmTags,
            session.Status,
            CurrentUrl = session.CurrentUrl,
            PageTitle = session.PageTitle,
            session.CreatedTime,
            session.UpdatedTime
        });

        return session;
    }

    public async Task<UserSession?> GetUserSessionAsync(string sessionId)
    {
        const string sql = @"
            SELECT * FROM ""UserSessions""
            WHERE ""SessionId"" = @SessionId";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<UserSession>(sql, new { SessionId = sessionId });
    }

    public async Task<bool> UpdateUserSessionAsync(UserSession session)
    {
        const string sql = @"
            UPDATE ""UserSessions""
            SET ""ConnectionId"" = @ConnectionId,
                ""IsOnline"" = @IsOnline,
                ""LastActiveTime"" = @LastActiveTime,
                ""DisconnectedTime"" = @DisconnectedTime,
                ""CurrentUrl"" = @CurrentUrl,
                ""PageTitle"" = @PageTitle,
                ""UpdatedTime"" = @UpdatedTime
            WHERE ""SessionId"" = @SessionId";

        using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new
        {
            session.ConnectionId,
            session.IsOnline,
            session.LastActiveTime,
            session.DisconnectedTime,
            CurrentUrl = session.CurrentUrl,
            PageTitle = session.PageTitle,
            UpdatedTime = DateTime.UtcNow,
            session.SessionId
        });

        return affected > 0;
    }

    // ==================== 頁面瀏覽記錄 ====================

    public async Task<VisitorPageView> SavePageViewAsync(VisitorPageView pageView)
    {
        const string sql = @"
            INSERT INTO ""VisitorPageViews""
            (""Id"", ""SessionId"", ""Url"", ""Title"", ""ViewTime"",
             ""DurationSeconds"", ""ReferrerUrl"", ""CreatedTime"")
            VALUES
            (@Id, @SessionId, @Url, @Title, @ViewTime,
             @DurationSeconds, @ReferrerUrl, @CreatedTime)";

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.ExecuteAsync(sql, new
        {
            pageView.Id,
            pageView.SessionId,
            pageView.Url,
            pageView.Title,
            pageView.ViewTime,
            pageView.DurationSeconds,
            pageView.ReferrerUrl,
            CreatedTime = DateTime.UtcNow
        });

        return pageView;
    }

    public async Task<List<VisitorPageView>> GetPageViewsAsync(string sessionId)
    {
        const string sql = @"
            SELECT * FROM ""VisitorPageViews""
            WHERE ""SessionId"" = @SessionId
            ORDER BY ""ViewTime""";

        using var connection = new NpgsqlConnection(_connectionString);
        var pageViews = await connection.QueryAsync<VisitorPageView>(sql, new { SessionId = sessionId });
        return pageViews.ToList();
    }

    // ==================== 對話記錄管理（暫不實作） ====================

    public Task<ChatConversation> SaveConversationAsync(ChatConversation conversation)
    {
        // 暫不實作，返回原對象
        return Task.FromResult(conversation);
    }

    public Task<bool> UpdateConversationAsync(ChatConversation conversation)
    {
        // 暫不實作，返回 true
        return Task.FromResult(true);
    }

    public Task<ChatConversation?> GetConversationAsync(string sessionId)
    {
        // 暫不實作，返回 null
        return Task.FromResult<ChatConversation?>(null);
    }
}
