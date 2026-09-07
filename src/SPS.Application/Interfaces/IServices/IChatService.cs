using SPS.Application.DTOs.Chat;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 聊天服務接口
/// </summary>
public interface IChatService
{
    /// <summary>
    /// 獲取所有在線訪客
    /// </summary>
    Task<List<UserSessionDto>> GetOnlineVisitorsAsync();

    /// <summary>
    /// 獲取訪客會話詳情
    /// </summary>
    Task<UserSessionDto?> GetVisitorSessionAsync(string sessionId);

    /// <summary>
    /// 獲取聊天歷史
    /// </summary>
    Task<List<ChatMessageDto>> GetChatHistoryAsync(string sessionId, int skip = 0, int limit = 50);

    /// <summary>
    /// 獲取訪客頁面瀏覽歷史
    /// </summary>
    Task<List<VisitorPageViewDto>> GetPageViewHistoryAsync(string sessionId);

    /// <summary>
    /// 獲取未讀消息數量
    /// </summary>
    Task<int> GetUnreadMessageCountAsync(string sessionId);

    /// <summary>
    /// 獲取所有會話統計
    /// </summary>
    Task<Dictionary<string, int>> GetSessionStatisticsAsync();
}