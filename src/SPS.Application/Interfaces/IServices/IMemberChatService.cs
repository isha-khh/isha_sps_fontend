using SPS.Application.DTOs.Chat;

namespace SPS.Application.Interfaces.IServices;

public interface IMemberChatService
{
    Task<ChatRecordDto> GetOrCreateMemberChatAsync(Guid initiatorMemberId, Guid targetMemberId, CancellationToken ct);
    Task<ChatRecordDto> GetOrCreateAdminChatAsync(Guid memberId, Guid adminUserId, CancellationToken ct);
    Task<MessageDto> SaveMessageAsync(long chatRecordId, Guid? senderMemberId, Guid? senderUserId, string text, CancellationToken ct);
    Task<List<MessageDto>> GetMessagesAsync(long chatRecordId, int skip, int take, CancellationToken ct);
    Task MarkAsReadAsync(long chatRecordId, Guid? readerMemberId, Guid? readerUserId, CancellationToken ct);
    Task<List<ChatRecordDto>> GetChatListForMemberAsync(Guid memberId, CancellationToken ct);
    Task<List<ChatRecordDto>> GetChatListForAdminAsync(Guid userId, CancellationToken ct);
    Task<bool> IsParticipantAsync(long chatRecordId, Guid? memberId, Guid? userId, CancellationToken ct);
    Task<int> GetTotalUnreadCountAsync(Guid? memberId, Guid? userId, CancellationToken ct);
    Task<ChatRecordDto> CreateCustomerServiceChatAsync(Guid memberId, CancellationToken ct);
    Task<ChatRecordDto> ClaimChatAsync(long chatRecordId, Guid adminUserId, CancellationToken ct);
    Task<ChatRecordDto> LeaveChatAsync(long chatRecordId, Guid adminUserId, CancellationToken ct);
    Task<List<ChatRecordDto>> GetWaitingChatsAsync(CancellationToken ct);
    Task<List<Guid>> GetCustomerServiceAdminIdsAsync(CancellationToken ct);
}
