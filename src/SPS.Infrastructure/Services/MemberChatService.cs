using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Chat;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

public class MemberChatService : IMemberChatService
{
    private readonly ApplicationDbContext _db;

    public MemberChatService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ChatRecordDto> GetOrCreateMemberChatAsync(Guid initiatorMemberId, Guid targetMemberId, CancellationToken ct)
    {
        var record = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Company)
            .FirstOrDefaultAsync(cr =>
                cr.Type == 1 &&
                ((cr.InitiatorMemberId == initiatorMemberId && cr.TargetMemberId == targetMemberId) ||
                 (cr.InitiatorMemberId == targetMemberId && cr.TargetMemberId == initiatorMemberId)), ct);

        if (record == null)
        {
            record = new ChatRecord
            {
                Type = 1,
                InitiatorMemberId = initiatorMemberId,
                TargetMemberId = targetMemberId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };
            _db.ChatRecords.Add(record);
            await _db.SaveChangesAsync(ct);

            record = await _db.ChatRecords
                .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
                .Include(cr => cr.TargetMember).ThenInclude(m => m!.Person)
                .FirstAsync(cr => cr.Id == record.Id, ct);
        }

        return MapChatRecord(record, 0, null);
    }

    public async Task<ChatRecordDto> GetOrCreateAdminChatAsync(Guid memberId, Guid adminUserId, CancellationToken ct)
    {
        var record = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetUser)
            .FirstOrDefaultAsync(cr =>
                cr.Type == 2 &&
                cr.InitiatorMemberId == memberId &&
                cr.TargetUserId == adminUserId, ct);

        if (record == null)
        {
            record = new ChatRecord
            {
                Type = 2,
                InitiatorMemberId = memberId,
                TargetUserId = adminUserId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };
            _db.ChatRecords.Add(record);
            await _db.SaveChangesAsync(ct);

            record = await _db.ChatRecords
                .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
                .Include(cr => cr.TargetUser)
                .FirstAsync(cr => cr.Id == record.Id, ct);
        }

        return MapChatRecord(record, 0, null);
    }

    public async Task<MessageDto> SaveMessageAsync(long chatRecordId, Guid? senderMemberId, Guid? senderUserId, string text, CancellationToken ct)
    {
        var msg = new Messages
        {
            ChatRecordId = chatRecordId,
            InitiatorMemberId = senderMemberId,
            InitiatorUserId = senderUserId,
            Text = text,
            IsRead = false,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };
        _db.Messages.Add(msg);
        await _db.SaveChangesAsync(ct);

        var entry = _db.Entry(msg);
        if (senderMemberId.HasValue)
        {
            await entry.Reference(m => m.InitiatorMember).LoadAsync(ct);
            if (msg.InitiatorMember != null)
            {
                await _db.Entry(msg.InitiatorMember).Reference(m => m.Person).LoadAsync(ct);
                await _db.Entry(msg.InitiatorMember).Reference(m => m.Photo).LoadAsync(ct);
            }
        }
        if (senderUserId.HasValue)
            await entry.Reference(m => m.InitiatorUser).LoadAsync(ct);

        return MapMessage(msg);
    }

    public async Task<List<MessageDto>> GetMessagesAsync(long chatRecordId, int skip, int take, CancellationToken ct)
    {
        var messages = await _db.Messages
            .Where(m => m.ChatRecordId == chatRecordId)
            .OrderByDescending(m => m.CreatedTime)
            .Skip(skip)
            .Take(take)
            .Include(m => m.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(m => m.InitiatorMember).ThenInclude(m => m!.Photo)
            .Include(m => m.InitiatorUser)
            .ToListAsync(ct);

        messages.Reverse();
        return messages.Select(MapMessage).ToList();
    }

    public async Task MarkAsReadAsync(long chatRecordId, Guid? readerMemberId, Guid? readerUserId, CancellationToken ct)
    {
        var query = _db.Messages
            .Where(m => m.ChatRecordId == chatRecordId && !m.IsRead);

        if (readerMemberId.HasValue)
            query = query.Where(m => m.InitiatorMemberId != readerMemberId);
        else if (readerUserId.HasValue)
            query = query.Where(m => m.InitiatorUserId != readerUserId);

        await query.ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true), ct);
    }

    public async Task<List<ChatRecordDto>> GetChatListForMemberAsync(Guid memberId, CancellationToken ct)
    {
        var records = await _db.ChatRecords
            .Where(cr => cr.InitiatorMemberId == memberId || cr.TargetMemberId == memberId)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.InitiatorUser)
            .Include(cr => cr.TargetUser)
            .OrderByDescending(cr => cr.UpdatedTime)
            .ToListAsync(ct);

        if (records.Count == 0)
            return new List<ChatRecordDto>();

        var chatIds = records.Select(cr => cr.Id).ToList();

        // 批次取得每個聊天室的最後一條訊息
        var lastMessages = await _db.Messages
            .Where(m => m.ChatRecordId.HasValue && chatIds.Contains(m.ChatRecordId.Value))
            .Include(m => m.InitiatorMember)
            .Include(m => m.InitiatorUser)
            .GroupBy(m => m.ChatRecordId)
            .Select(g => g.OrderByDescending(m => m.CreatedTime).First())
            .ToListAsync(ct);

        var lastMsgDict = lastMessages.ToDictionary(m => m.ChatRecordId!.Value, m => m);

        // 批次取得每個聊天室的未讀數量
        var unreadCounts = await _db.Messages
            .Where(m => m.ChatRecordId.HasValue && chatIds.Contains(m.ChatRecordId.Value) && !m.IsRead && m.InitiatorMemberId != memberId)
            .GroupBy(m => m.ChatRecordId)
            .Select(g => new { ChatRecordId = g.Key!.Value, Count = g.Count() })
            .ToListAsync(ct);

        var unreadDict = unreadCounts.ToDictionary(x => x.ChatRecordId, x => x.Count);

        return records.Select(cr =>
        {
            lastMsgDict.TryGetValue(cr.Id, out var lastMsg);
            unreadDict.TryGetValue(cr.Id, out var unread);
            return MapChatRecord(cr, unread, lastMsg != null ? MapMessage(lastMsg) : null);
        }).ToList();
    }

    public async Task<List<ChatRecordDto>> GetChatListForAdminAsync(Guid userId, CancellationToken ct)
    {
        var records = await _db.ChatRecords
            .Where(cr => cr.InitiatorUserId == userId || cr.TargetUserId == userId)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.TargetMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.InitiatorUser)
            .Include(cr => cr.TargetUser)
            .OrderByDescending(cr => cr.UpdatedTime)
            .ToListAsync(ct);

        if (records.Count == 0)
            return new List<ChatRecordDto>();

        var chatIds = records.Select(cr => cr.Id).ToList();

        // 批次取得每個聊天室的最後一條訊息
        var lastMessages = await _db.Messages
            .Where(m => m.ChatRecordId.HasValue && chatIds.Contains(m.ChatRecordId.Value))
            .Include(m => m.InitiatorMember)
            .Include(m => m.InitiatorUser)
            .GroupBy(m => m.ChatRecordId)
            .Select(g => g.OrderByDescending(m => m.CreatedTime).First())
            .ToListAsync(ct);

        var lastMsgDict = lastMessages.ToDictionary(m => m.ChatRecordId!.Value, m => m);

        // 批次取得每個聊天室的未讀數量
        var unreadCounts = await _db.Messages
            .Where(m => m.ChatRecordId.HasValue && chatIds.Contains(m.ChatRecordId.Value) && !m.IsRead && m.InitiatorUserId != userId)
            .GroupBy(m => m.ChatRecordId)
            .Select(g => new { ChatRecordId = g.Key!.Value, Count = g.Count() })
            .ToListAsync(ct);

        var unreadDict = unreadCounts.ToDictionary(x => x.ChatRecordId, x => x.Count);

        return records.Select(cr =>
        {
            lastMsgDict.TryGetValue(cr.Id, out var lastMsg);
            unreadDict.TryGetValue(cr.Id, out var unread);
            return MapChatRecord(cr, unread, lastMsg != null ? MapMessage(lastMsg) : null);
        }).ToList();
    }

    public async Task<bool> IsParticipantAsync(long chatRecordId, Guid? memberId, Guid? userId, CancellationToken ct)
    {
        var cr = await _db.ChatRecords.AsNoTracking().FirstOrDefaultAsync(c => c.Id == chatRecordId, ct);
        if (cr == null) return false;

        // Type=2 (member↔admin customer service): check status-based participation
        if (cr.Type == 2)
        {
            if (memberId.HasValue && cr.InitiatorMemberId == memberId)
                return true;
            if (userId.HasValue && cr.Status == ChatStatus.Active && cr.TargetUserId == userId)
                return true;
            return false;
        }

        // Other types: original logic
        return (memberId.HasValue && (cr.InitiatorMemberId == memberId || cr.TargetMemberId == memberId)) ||
               (userId.HasValue && (cr.InitiatorUserId == userId || cr.TargetUserId == userId));
    }

    public async Task<int> GetTotalUnreadCountAsync(Guid? memberId, Guid? userId, CancellationToken ct)
    {
        var chatIds = await _db.ChatRecords
            .Where(cr =>
                (memberId.HasValue && (cr.InitiatorMemberId == memberId || cr.TargetMemberId == memberId)) ||
                (userId.HasValue && (cr.InitiatorUserId == userId || cr.TargetUserId == userId)))
            .Select(cr => cr.Id)
            .ToListAsync(ct);

        if (chatIds.Count == 0) return 0;

        var query = _db.Messages
            .Where(m => chatIds.Contains(m.ChatRecordId!.Value) && !m.IsRead);

        if (memberId.HasValue)
            query = query.Where(m => m.InitiatorMemberId != memberId);
        else if (userId.HasValue)
            query = query.Where(m => m.InitiatorUserId != userId);

        return await query.CountAsync(ct);
    }

    public async Task<ChatRecordDto> CreateCustomerServiceChatAsync(Guid memberId, CancellationToken ct)
    {
        // Check if member already has a Waiting/Active Type=2 chat
        var existing = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetUser)
            .FirstOrDefaultAsync(cr =>
                cr.Type == 2 &&
                cr.InitiatorMemberId == memberId &&
                (cr.Status == ChatStatus.Waiting || cr.Status == ChatStatus.Active), ct);

        if (existing != null)
            return MapChatRecord(existing, 0, null);

        var record = new ChatRecord
        {
            Type = 2,
            Status = ChatStatus.Waiting,
            InitiatorMemberId = memberId,
            TargetUserId = null,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };
        _db.ChatRecords.Add(record);
        await _db.SaveChangesAsync(ct);

        record = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetUser)
            .FirstAsync(cr => cr.Id == record.Id, ct);

        return MapChatRecord(record, 0, null);
    }

    public async Task<ChatRecordDto> ClaimChatAsync(long chatRecordId, Guid adminUserId, CancellationToken ct)
    {
        var record = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetUser)
            .FirstOrDefaultAsync(cr => cr.Id == chatRecordId, ct)
            ?? throw new InvalidOperationException("Chat not found.");

        if (record.Status != ChatStatus.Waiting)
            throw new InvalidOperationException("Chat is not in waiting status.");

        record.TargetUserId = adminUserId;
        record.Status = ChatStatus.Active;
        record.UpdatedTime = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Reload to get TargetUser navigation
        await _db.Entry(record).Reference(r => r.TargetUser).LoadAsync(ct);

        return MapChatRecord(record, 0, null);
    }

    public async Task<ChatRecordDto> LeaveChatAsync(long chatRecordId, Guid adminUserId, CancellationToken ct)
    {
        var record = await _db.ChatRecords
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .FirstOrDefaultAsync(cr => cr.Id == chatRecordId, ct)
            ?? throw new InvalidOperationException("Chat not found.");

        if (record.TargetUserId != adminUserId)
            throw new InvalidOperationException("You are not the assigned agent.");

        record.TargetUserId = null;
        record.Status = ChatStatus.Waiting;
        record.UpdatedTime = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return MapChatRecord(record, 0, null);
    }

    public async Task<List<ChatRecordDto>> GetWaitingChatsAsync(CancellationToken ct)
    {
        var records = await _db.ChatRecords
            .Where(cr => cr.Type == 2 && cr.Status == ChatStatus.Waiting)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Person)
            .Include(cr => cr.InitiatorMember).ThenInclude(m => m!.Company)
            .Include(cr => cr.TargetUser)
            .OrderByDescending(cr => cr.CreatedTime)
            .ToListAsync(ct);

        if (records.Count == 0)
            return new List<ChatRecordDto>();

        var chatIds = records.Select(cr => cr.Id).ToList();

        // 批次取得每個聊天室的最後一條訊息
        var lastMessages = await _db.Messages
            .Where(m => m.ChatRecordId.HasValue && chatIds.Contains(m.ChatRecordId.Value))
            .Include(m => m.InitiatorMember)
            .Include(m => m.InitiatorUser)
            .GroupBy(m => m.ChatRecordId)
            .Select(g => g.OrderByDescending(m => m.CreatedTime).First())
            .ToListAsync(ct);

        var lastMsgDict = lastMessages.ToDictionary(m => m.ChatRecordId!.Value, m => m);

        return records.Select(cr =>
        {
            lastMsgDict.TryGetValue(cr.Id, out var lastMsg);
            return MapChatRecord(cr, 0, lastMsg != null ? MapMessage(lastMsg) : null);
        }).ToList();
    }

    public async Task<List<Guid>> GetCustomerServiceAdminIdsAsync(CancellationToken ct)
    {
        var csFlag = UserPermission.CustomerService;

        return await _db.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => (ur.Role.Permissions & csFlag) == csFlag)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);
    }

    private static ChatRecordDto MapChatRecord(ChatRecord cr, int unreadCount, MessageDto? lastMessage)
    {
        return new ChatRecordDto
        {
            Id = cr.Id,
            Type = cr.Type,
            Status = (short)cr.Status,
            AgentName = cr.TargetUser?.Name,
            InitiatorMemberId = cr.InitiatorMemberId,
            InitiatorMemberName = cr.InitiatorMember?.Person?.Name ?? cr.InitiatorMember?.Nickname,
            InitiatorMemberRole = cr.InitiatorMember != null ? (short?)cr.InitiatorMember.Role : null,
            InitiatorCompanyName = cr.InitiatorMember?.Company?.Name,
            TargetMemberId = cr.TargetMemberId,
            TargetMemberName = cr.TargetMember?.Person?.Name ?? cr.TargetMember?.Nickname,
            TargetMemberRole = cr.TargetMember != null ? (short?)cr.TargetMember.Role : null,
            TargetCompanyName = cr.TargetMember?.Company?.Name,
            InitiatorUserId = cr.InitiatorUserId,
            InitiatorUserName = cr.InitiatorUser?.Name,
            TargetUserId = cr.TargetUserId,
            TargetUserName = cr.TargetUser?.Name,
            LastMessage = lastMessage,
            UnreadCount = unreadCount,
            CreatedTime = cr.CreatedTime
        };
    }

    private static MessageDto MapMessage(Messages m)
    {
        string? avatarUrl = null;
        if (m.InitiatorUserId.HasValue && m.InitiatorUser?.AvatarFileId != null)
            avatarUrl = $"/api/FileManagement/{m.InitiatorUser.AvatarFileId}/download";
        else if (m.InitiatorMemberId.HasValue && m.InitiatorMember?.Photo?.Uri != null)
            avatarUrl = m.InitiatorMember.Photo.Uri;

        return new MessageDto
        {
            Id = m.Id,
            ChatRecordId = m.ChatRecordId ?? 0,
            SenderMemberId = m.InitiatorMemberId,
            SenderMemberName = m.InitiatorMember?.Person?.Name ?? m.InitiatorMember?.Nickname,
            SenderUserId = m.InitiatorUserId,
            SenderUserName = m.InitiatorUser?.Name,
            SenderType = m.InitiatorUserId.HasValue ? "admin" : "member",
            SenderAvatarUrl = avatarUrl,
            Text = m.Text,
            IsRead = m.IsRead,
            CreatedTime = m.CreatedTime
        };
    }
}
