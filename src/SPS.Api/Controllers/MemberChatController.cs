using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Hubs;
using SPS.Application.DTOs.Chat;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

[ApiController]
[Route("api/member-chat")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("會員聊天控制器")]
public class MemberChatController : ControllerBase
{
    private const int MaxMessageLength = 1000;
    private const int MaxMessagesPerMinute = 20;

    private readonly IMemberChatService _chatService;
    private readonly IHubContext<MemberHub> _hub;
    private readonly INotificationService _notificationService;
    private readonly IMemoryCache _cache;
    private readonly IDirectChatService _direct;

    public MemberChatController(IMemberChatService chatService, IHubContext<MemberHub> hub, INotificationService notificationService, IMemoryCache cache, IDirectChatService direct)
    {
        _direct = direct;
        _chatService = chatService;
        _hub = hub;
        _notificationService = notificationService;
        _cache = cache;
    }

    private Guid GetMemberId()
    {
        var claim = User.FindFirst("MemberId")?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("MemberId not found in claims.");
        return id;
    }

    [HttpGet("list")]
    [SwaggerOperation(Summary = "取得會員聊天列表")]
    public async Task<ActionResult<List<ChatRecordDto>>> GetChatList(CancellationToken ct)
    {
        var memberId = GetMemberId();
        var result = await _chatService.GetChatListForMemberAsync(memberId, ct);
        // 補上需求名稱與封鎖狀態，並濾掉沒有綁定需求回應的舊會員對話
        return Ok(await _direct.EnrichAsync(memberId, result, ct));
    }

    /// <summary>
    /// 需求刊登者對「審核通過的回應」的回應者開啟對話（綁定那則回應；已經開過就回傳既有的）。
    /// 只有刊登那筆需求的會員可以，其他情況（回應未通過、封鎖、一天開太多）會回 400
    /// </summary>
    [HttpPost("demand-reply/{replyId:int}")]
    [SwaggerOperation(Summary = "對需求回應的回應者開啟對話")]
    public async Task<ActionResult<ChatRecordDto>> OpenForReply(int replyId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        var opened = await _direct.OpenForReplyAsync(memberId, replyId, ct);
        if (!opened.IsSuccess) return BadRequest(new { error = opened.Error });
        var chats = await _direct.EnrichAsync(memberId, await _chatService.GetChatListForMemberAsync(memberId, ct), ct);
        var chat = chats.FirstOrDefault(c => c.Id == opened.Data);
        return chat == null ? NotFound() : Ok(chat);
    }

    [HttpGet("{chatRecordId:long}/messages")]
    [SwaggerOperation(Summary = "取得聊天訊息歷史")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(long chatRecordId, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        skip = Math.Max(0, skip);
        take = Math.Clamp(take, 1, 200);
        var memberId = GetMemberId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, null, ct))
            return Forbid();

        var result = await _chatService.GetMessagesAsync(chatRecordId, skip, take, ct);
        return Ok(result);
    }

    [HttpPost("create")]
    [SwaggerOperation(Summary = "建立會員對會員聊天")]
    public Task<ActionResult<ChatRecordDto>> CreateChat([FromBody] CreateChatRequest request, CancellationToken ct)
    {
        // 會員之間互傳訊息的規則（誰能傳給誰、是否要審核、封鎖與檢舉）還沒決定，先不開放，避免任何會員都能對其他會員發起對話
        // （規劃見 docs/會員收件匣規劃-2026-10-12.md 第三階段）
        return Task.FromResult<ActionResult<ChatRecordDto>>(StatusCode(StatusCodes.Status403Forbidden, new { error = "會員之間的訊息功能尚未開放" }));
    }

    [HttpPost("create-admin")]
    [SwaggerOperation(Summary = "建立會員對客服聊天（待領收）")]
    public async Task<ActionResult<ChatRecordDto>> CreateAdminChat(CancellationToken ct)
    {
        var memberId = GetMemberId();

        // 已經有進行中的客服對話就直接回傳，不重複通知客服
        var hadOpenChat = (await _chatService.GetChatListForMemberAsync(memberId, ct)).Any(c => c.Type == 2 && c.Status != (short)ChatStatus.Closed);
        var result = await _chatService.CreateCustomerServiceChatAsync(memberId, ct);

        if (!hadOpenChat)
        {
            // 跟 MemberHub.CreateAdminChat 一樣：通知在線的客服、替每位客服建立站內通知
            await _hub.Clients.Group("cs-agents").SendAsync("NewWaitingChat", result, cancellationToken: ct);
            var memberName = result.InitiatorMemberName ?? "會員";
            foreach (var adminId in await _chatService.GetCustomerServiceAdminIdsAsync(ct))
            {
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Type = NotificationType.InApp,
                    Category = "CustomerService",
                    Title = "新客服聊天請求",
                    Content = $"會員 {memberName} 發起客服聊天",
                    SendId = result.Id.ToString(),
                    Recipient = adminId.ToString()
                });
            }
        }

        return Ok(result);
    }

    /// <summary>會員在客服對話裡傳訊息（用 HTTP 傳，前台以輪詢更新；後台客服仍透過即時連線收到）。限客服對話、對話未結束、每分鐘最多 20 則、每則最多 1000 字</summary>
    [HttpPost("{chatRecordId:long}/messages")]
    [SwaggerOperation(Summary = "傳送客服對話訊息")]
    public async Task<ActionResult<MessageDto>> SendMessage(long chatRecordId, [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var memberId = GetMemberId();
        var text = request.Text?.Trim();
        if (string.IsNullOrEmpty(text)) return BadRequest(new { error = "請輸入訊息內容" });
        if (text.Length > MaxMessageLength) return BadRequest(new { error = $"訊息最多 {MaxMessageLength} 字" });

        var chat = (await _chatService.GetChatListForMemberAsync(memberId, ct)).FirstOrDefault(c => c.Id == chatRecordId);
        if (chat == null) return Forbid();
        // 規則集中在 IDirectChatService：對話是否結束、會員之間的對話是否綁定需求回應、有沒有被封鎖、對方帳號是否可用
        var blocked = await _direct.CheckCanSendAsync(memberId, chatRecordId, ct);
        if (blocked != null) return BadRequest(new { error = blocked });

        // 防洗版：每位會員每分鐘最多 MaxMessagesPerMinute 則
        var counter = _cache.GetOrCreate($"member-chat-rate:{memberId}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref counter[0]) > MaxMessagesPerMinute)
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "傳送太頻繁，請稍後再試" });

        var message = await _chatService.SaveMessageAsync(chatRecordId, memberId, null, text, ct);
        ChatTypingState.Clear(_cache, chatRecordId, chat.Type == 2 ? "member" : $"member:{memberId}");

        // 即時通知：客服對話通知客服（已領取的通知該客服，等待中的通知所有在線客服）；會員之間的對話通知對方
        var groups = new List<string> { $"member:{memberId}" };
        if (chat.Type == 2)
        {
            groups.Add("cs-agents");
            if (chat.TargetUserId.HasValue) groups.Add($"admin:{chat.TargetUserId.Value}");
        }
        else
        {
            var peer = await _direct.GetPeerMemberIdAsync(memberId, chatRecordId, ct);
            if (peer.HasValue) groups.Add($"member:{peer.Value}");
        }
        foreach (var group in groups.Distinct())
            await _hub.Clients.Group(group).SendAsync("ReceiveMessage", message, cancellationToken: ct);

        return Ok(message);
    }

    /// <summary>
    /// 會員回報「正在輸入」（前台輸入時每幾秒呼叫一次，見 <see cref="ChatTypingState"/>）：客服對話只通知客服那端
    /// （已領取的對話通知該客服，等待中的對話通知所有在線客服）；會員之間的對話只通知對方
    /// </summary>
    [HttpPost("{chatRecordId:long}/typing")]
    [SwaggerOperation(Summary = "回報正在輸入")]
    public async Task<IActionResult> Typing(long chatRecordId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        var chat = (await _chatService.GetChatListForMemberAsync(memberId, ct)).FirstOrDefault(c => c.Id == chatRecordId);
        if (chat == null || chat.Status == (short)ChatStatus.Closed) return NoContent();

        if (chat.Type == 2)
        {
            ChatTypingState.Set(_cache, chatRecordId, "member");
            var group = chat.TargetUserId.HasValue ? $"admin:{chat.TargetUserId.Value}" : "cs-agents";
            await _hub.Clients.Group(group).SendAsync("UserTyping", new { chatRecordId, senderType = "member" }, cancellationToken: ct);
        }
        else if (await _direct.CheckCanSendAsync(memberId, chatRecordId, ct) == null)
        {
            var peer = await _direct.GetPeerMemberIdAsync(memberId, chatRecordId, ct);
            if (peer.HasValue)
            {
                ChatTypingState.Set(_cache, chatRecordId, $"member:{memberId}");
                await _hub.Clients.Group($"member:{peer.Value}").SendAsync("UserTyping", new { chatRecordId, senderType = "member" }, cancellationToken: ct);
            }
        }

        return NoContent();
    }

    /// <summary>
    /// 對方是不是正在輸入（前台輪詢備援用，輸入狀態 5 秒內沒更新就當作停止）：客服對話是客服，會員之間的對話是另一位會員。
    /// <c>agentTyping</c> 與 <c>peerTyping</c> 同值（前者是舊名稱）
    /// </summary>
    [HttpGet("{chatRecordId:long}/typing")]
    [SwaggerOperation(Summary = "查詢對方是否正在輸入")]
    public async Task<IActionResult> GetTyping(long chatRecordId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, null, ct)) return Forbid();

        var peer = await _direct.GetPeerMemberIdAsync(memberId, chatRecordId, ct);
        var typing = peer.HasValue
            ? ChatTypingState.IsTyping(_cache, chatRecordId, $"member:{peer.Value}")
            : ChatTypingState.IsTyping(_cache, chatRecordId, "admin");
        return Ok(new { agentTyping = typing, peerTyping = typing });
    }

    /// <summary>把對話裡對方傳來的訊息標為已讀</summary>
    [HttpPost("{chatRecordId:long}/read")]
    [SwaggerOperation(Summary = "標記對話已讀")]
    public async Task<IActionResult> MarkRead(long chatRecordId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, null, ct)) return Forbid();
        await _chatService.MarkAsReadAsync(chatRecordId, memberId, null, ct);
        await _hub.Clients.Group($"member:{memberId}").SendAsync("MessagesRead", new { chatRecordId }, cancellationToken: ct);
        var peer = await _direct.GetPeerMemberIdAsync(memberId, chatRecordId, ct);
        if (peer.HasValue) await _hub.Clients.Group($"member:{peer.Value}").SendAsync("MessagesRead", new { chatRecordId }, cancellationToken: ct);
        return NoContent();
    }

    /// <summary>封鎖對話的另一方：雙方都不能再在這個對話傳訊息（已經存在的訊息保留），可以隨時解除</summary>
    [HttpPost("{chatRecordId:long}/block")]
    [SwaggerOperation(Summary = "封鎖對方")]
    public async Task<IActionResult> Block(long chatRecordId, CancellationToken ct)
    {
        var r = await _direct.BlockAsync(GetMemberId(), chatRecordId, ct);
        return r.IsSuccess ? NoContent() : BadRequest(new { error = r.Error });
    }

    [HttpDelete("{chatRecordId:long}/block")]
    [SwaggerOperation(Summary = "解除封鎖")]
    public async Task<IActionResult> Unblock(long chatRecordId, CancellationToken ct)
    {
        var r = await _direct.UnblockAsync(GetMemberId(), chatRecordId, ct);
        return r.IsSuccess ? NoContent() : BadRequest(new { error = r.Error });
    }

    /// <summary>檢舉會員之間的對話：承辦人員平常看不到對話內容，檢舉後這個對話才開放給後台審閱</summary>
    [HttpPost("{chatRecordId:long}/report")]
    [SwaggerOperation(Summary = "檢舉對話")]
    public async Task<IActionResult> Report(long chatRecordId, [FromBody] ReportChatRequest request, CancellationToken ct)
    {
        var r = await _direct.ReportAsync(GetMemberId(), chatRecordId, request, ct);
        return r.IsSuccess ? Ok(new { message = "已收到您的檢舉，承辦人員會審閱這個對話" }) : BadRequest(new { error = r.Error });
    }

    [HttpGet("unread-count")]
    [SwaggerOperation(Summary = "取得總未讀數")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var memberId = GetMemberId();
        var count = await _chatService.GetTotalUnreadCountAsync(memberId, null, ct);
        return Ok(count);
    }
}
