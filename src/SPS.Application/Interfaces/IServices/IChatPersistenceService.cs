using SPS.Domain.Entities;

namespace SPS.Application.Interfaces;

/// <summary>
/// 聊天系統持久化服務介面（PostgreSQL）
/// </summary>
public interface IChatPersistenceService
{
    /// <summary>
    /// 保存聊天消息
    /// </summary>
    Task<ChatMessage> SaveMessageAsync(ChatMessage message);

    /// <summary>
    /// 獲取會話的聊天歷史
    /// </summary>
    Task<List<ChatMessage>> GetMessagesAsync(string sessionId, int skip = 0, int limit = 50);

    /// <summary>
    /// 保存用戶會話
    /// </summary>
    Task<UserSession> SaveUserSessionAsync(UserSession session);

    /// <summary>
    /// 更新用戶會話
    /// </summary>
    Task<bool> UpdateUserSessionAsync(UserSession session);

    /// <summary>
    /// 獲取用戶會話
    /// </summary>
    Task<UserSession?> GetUserSessionAsync(string sessionId);

    /// <summary>
    /// 保存頁面瀏覽記錄
    /// </summary>
    Task<VisitorPageView> SavePageViewAsync(VisitorPageView pageView);

    /// <summary>
    /// 獲取會話的頁面瀏覽歷史
    /// </summary>
    Task<List<VisitorPageView>> GetPageViewsAsync(string sessionId);

    /// <summary>
    /// 保存對話記錄
    /// </summary>
    Task<ChatConversation> SaveConversationAsync(ChatConversation conversation);

    /// <summary>
    /// 更新對話記錄
    /// </summary>
    Task<bool> UpdateConversationAsync(ChatConversation conversation);

    /// <summary>
    /// 獲取對話記錄
    /// </summary>
    Task<ChatConversation?> GetConversationAsync(string sessionId);

    /// <summary>
    /// 標記消息為已讀
    /// </summary>
    Task<bool> MarkMessageAsReadAsync(Guid messageId);
}
