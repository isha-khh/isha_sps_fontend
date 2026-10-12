using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Api.Hubs;

[Authorize]
public class MemberHub : Hub
{
    private readonly IMemberChatService _chatService;
    private readonly IMemberChatRedisService _redisService;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<MemberHub> _logger;
    private readonly IMemoryCache _cache;
    private readonly IDirectChatService _direct;

    public MemberHub(
        IMemberChatService chatService,
        IMemberChatRedisService redisService,
        INotificationService notificationService,
        ApplicationDbContext db,
        ILogger<MemberHub> logger,
        IMemoryCache cache,
        IDirectChatService direct)
    {
        _direct = direct;
        _cache = cache;
        _chatService = chatService;
        _redisService = redisService;
        _notificationService = notificationService;
        _db = db;
        _logger = logger;
    }

    private (Guid entityId, string userType) GetIdentity()
    {
        var memberIdClaim = Context.User?.FindFirst("MemberId")?.Value;
        if (!string.IsNullOrEmpty(memberIdClaim) && Guid.TryParse(memberIdClaim, out var memberId))
            return (memberId, "member");

        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            return (userId, "admin");

        throw new HubException("Unable to determine user identity.");
    }

    private bool HasCustomerServicePermission()
    {
        // 一定要走 GetAdminPermissions：它先確認是後台 token，不會把會員 token 的權限位元誤當後台權限
        return Context.User?.GetAdminPermissions().HasAny(UserPermission.CustomerService) ?? false;
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            var (entityId, userType) = GetIdentity();
            var connId = Context.ConnectionId;

            await _redisService.SetConnectionAsync(connId, entityId, userType);
            await _redisService.SetOnlineAsync(entityId, userType, connId);
            await Groups.AddToGroupAsync(connId, $"{userType}:{entityId}");

            // Admin with CustomerService permission joins cs-agents group
            if (userType == "admin" && HasCustomerServicePermission())
            {
                await Groups.AddToGroupAsync(connId, "cs-agents");
            }

            _logger.LogInformation("MemberHub connected: {UserType}:{EntityId}", userType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in MemberHub.OnConnectedAsync");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var connId = Context.ConnectionId;
            var info = await _redisService.GetConnectionInfoAsync(connId);
            if (info.HasValue)
            {
                await Groups.RemoveFromGroupAsync(connId, $"{info.Value.userType}:{info.Value.entityId}");
                if (info.Value.userType == "admin")
                    await Groups.RemoveFromGroupAsync(connId, "cs-agents");
                await _redisService.SetOfflineAsync(connId);
            }
            await _redisService.RemoveConnectionAsync(connId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in MemberHub.OnDisconnectedAsync");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(long chatRecordId, string text)
    {
        var (entityId, userType) = GetIdentity();
        Guid? memberId = userType == "member" ? entityId : null;
        Guid? userId = userType == "admin" ? entityId : null;

        // For Type=2 chats, check if admin is the assigned agent and chat is Active
        var chatRecord = await _db.ChatRecords.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == chatRecordId);

        if (chatRecord is { Type: 2 } && userType == "admin")
        {
            if (chatRecord.Status != ChatStatus.Active || chatRecord.TargetUserId != entityId)
                throw new HubException("You are not the assigned agent for this chat.");
        }
        else if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, userId, CancellationToken.None))
        {
            throw new HubException("Not a participant of this chat.");
        }

        // 會員傳的訊息要符合同一套規則（對話是否結束、會員之間的對話是否綁定需求回應、封鎖、字數）；後台客服不受封鎖規則影響
        if (memberId.HasValue)
        {
            text = text?.Trim() ?? string.Empty;
            if (text.Length == 0 || text.Length > 1000) throw new HubException("訊息長度不正確");
            var blocked = await _direct.CheckCanSendAsync(memberId.Value, chatRecordId, CancellationToken.None);
            if (blocked != null) throw new HubException(blocked);
        }

        var msg = await _chatService.SaveMessageAsync(chatRecordId, memberId, userId, text, CancellationToken.None);

        // 送出訊息就代表不再輸入了
        ChatTypingState.Clear(_cache, chatRecordId, userType);

        await SendToParticipants(chatRecordId, "ReceiveMessage", msg);
    }

    public async Task MarkAsRead(long chatRecordId)
    {
        var (entityId, userType) = GetIdentity();
        Guid? memberId = userType == "member" ? entityId : null;
        Guid? userId = userType == "admin" ? entityId : null;

        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, userId, CancellationToken.None))
            throw new HubException("Not a participant of this chat.");

        await _chatService.MarkAsReadAsync(chatRecordId, memberId, userId, CancellationToken.None);

        await SendToParticipants(chatRecordId, "MessagesRead", new { chatRecordId });
    }

    public async Task SendTypingIndicator(long chatRecordId)
    {
        var (entityId, userType) = GetIdentity();
        Guid? memberId = userType == "member" ? entityId : null;
        Guid? userId = userType == "admin" ? entityId : null;

        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, userId, CancellationToken.None))
            return;

        // 只通知「對方」：不能傳回給輸入的人自己（原本後台客服自己輸入時，自己的畫面也會顯示「管理員正在輸入」）。
        // 同時記下輸入狀態，前台會員用輪詢查詢（GET api/member-chat/{id}/typing）
        ChatTypingState.Set(_cache, chatRecordId, userType);
        await SendToParticipants(chatRecordId, "UserTyping", new { chatRecordId, senderType = userType }, excludeGroup: $"{userType}:{entityId}");
    }

    public Task CreateMemberChat(Guid targetMemberId)
    {
        // 會員之間互傳訊息的規則（誰能傳給誰、是否要審核、封鎖與檢舉）還沒決定，先不開放（見 MemberChatController.CreateChat）。
        // 原本的實作：GetOrCreateMemberChatAsync 建立對話後，通知雙方的 member 群組 ChatCreated。
        throw new HubException("Member-to-member chats are not available yet.");
    }

    public async Task CreateAdminChat()
    {
        var (entityId, userType) = GetIdentity();
        if (userType != "member")
            throw new HubException("Only members can initiate admin chats.");

        var chat = await _chatService.CreateCustomerServiceChatAsync(entityId, CancellationToken.None);

        // Notify member
        await Clients.Group($"member:{entityId}").SendAsync("ChatCreated", chat);

        // Check if any CS agents are online
        var csAdminIds = await _chatService.GetCustomerServiceAdminIdsAsync(CancellationToken.None);
        var anyOnline = await _redisService.IsAnyOnlineAsync(csAdminIds, "admin");

        var statusText = anyOnline ? "目前客服在線中請稍等" : "目前客服均不在線";
        await Clients.Group($"member:{entityId}").SendAsync("SystemMessage", new
        {
            chatRecordId = chat.Id,
            text = statusText
        });

        // Notify all CS agents
        await Clients.Group("cs-agents").SendAsync("NewWaitingChat", chat);

        // Create InApp notifications for each CS admin
        var memberName = chat.InitiatorMemberName ?? "會員";
        foreach (var adminId in csAdminIds)
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Type = NotificationType.InApp,
                Category = "CustomerService",
                Title = "新客服聊天請求",
                Content = $"會員 {memberName} 發起客服聊天",
                SendId = chat.Id.ToString(),
                Recipient = adminId.ToString()
            });
        }
    }

    public async Task ClaimChat(long chatRecordId)
    {
        var (entityId, userType) = GetIdentity();
        if (userType != "admin")
            throw new HubException("Only admins can claim chats.");

        var chat = await _chatService.ClaimChatAsync(chatRecordId, entityId, CancellationToken.None);

        // Notify member
        var memberGroup = $"member:{chat.InitiatorMemberId}";
        await Clients.Group(memberGroup).SendAsync("ChatClaimed", chat);
        await Clients.Group(memberGroup).SendAsync("SystemMessage", new
        {
            chatRecordId = chat.Id,
            text = $"由 {chat.AgentName} 為您服務"
        });

        // Notify CS agents
        await Clients.Group("cs-agents").SendAsync("ChatClaimed", chat);
    }

    public async Task LeaveChat(long chatRecordId)
    {
        var (entityId, userType) = GetIdentity();
        if (userType != "admin")
            throw new HubException("Only admins can leave chats.");

        var chat = await _chatService.LeaveChatAsync(chatRecordId, entityId, CancellationToken.None);

        // Notify member
        var memberGroup = $"member:{chat.InitiatorMemberId}";
        await Clients.Group(memberGroup).SendAsync("ChatLeft", chat);
        await Clients.Group(memberGroup).SendAsync("SystemMessage", new
        {
            chatRecordId = chat.Id,
            text = "客服已離開，等待其他客服接手"
        });

        // Notify CS agents
        await Clients.Group("cs-agents").SendAsync("NewWaitingChat", chat);
    }

    private async Task SendToParticipants(long chatRecordId, string method, object data, string? excludeGroup = null)
    {
        var cr = await _db.ChatRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == chatRecordId);

        if (cr == null) return;

        var groups = new List<string>();
        if (cr.InitiatorMemberId.HasValue) groups.Add($"member:{cr.InitiatorMemberId.Value}");
        if (cr.TargetMemberId.HasValue) groups.Add($"member:{cr.TargetMemberId.Value}");
        if (cr.InitiatorUserId.HasValue) groups.Add($"admin:{cr.InitiatorUserId.Value}");
        if (cr.TargetUserId.HasValue) groups.Add($"admin:{cr.TargetUserId.Value}");

        foreach (var group in groups.Distinct())
        {
            if (group == excludeGroup) continue;
            await Clients.Group(group).SendAsync(method, data);
        }
    }
}
