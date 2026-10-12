using SPS.Application.DTOs.MemberNotification;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

/// <summary>會員收件匣的站內通知。寫入通知失敗不應該讓原本的流程（審核、發布）失敗，呼叫端不需要處理例外。</summary>
public interface IMemberNotificationService
{
    /// <summary>寫入一筆通知給單一會員</summary>
    Task AddAsync(Guid memberId, MemberNotificationType type, string title, string? content, string? linkPath, CancellationToken ct = default);

    /// <summary>寫入同一則通知給多個會員（同一會員只寫一筆）</summary>
    Task AddToManyAsync(IEnumerable<Guid> memberIds, MemberNotificationType type, string title, string? content, string? linkPath, CancellationToken ct = default);

    Task<MemberNotificationListResponse> GetListAsync(Guid memberId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid memberId, CancellationToken ct = default);
    Task MarkReadAsync(Guid memberId, long id, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid memberId, CancellationToken ct = default);
}
