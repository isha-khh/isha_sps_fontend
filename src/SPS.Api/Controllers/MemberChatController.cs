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

    public MemberChatController(IMemberChatService chatService, IHubContext<MemberHub> hub, INotificationService notificationService, IMemoryCache cache)
    {
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
        return Ok(result);
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
        // 目前只開放會員與客服的對話（會員之間見 CreateChat 的說明）
        if (chat.Type != 2) return StatusCode(StatusCodes.Status403Forbidden, new { error = "會員之間的訊息功能尚未開放" });
        if (chat.Status == (short)ChatStatus.Closed) return BadRequest(new { error = "這個對話已經結束，請重新聯絡客服" });

        // 防洗版：每位會員每分鐘最多 MaxMessagesPerMinute 則
        var counter = _cache.GetOrCreate($"member-chat-rate:{memberId}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref counter[0]) > MaxMessagesPerMinute)
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "傳送太頻繁，請稍後再試" });

        var message = await _chatService.SaveMessageAsync(chatRecordId, memberId, null, text, ct);

        // 即時通知客服：已領取的對話通知該客服，等待中的對話通知所有在線客服
        var groups = new List<string> { $"member:{memberId}", "cs-agents" };
        if (chat.TargetUserId.HasValue) groups.Add($"admin:{chat.TargetUserId.Value}");
        foreach (var group in groups.Distinct())
            await _hub.Clients.Group(group).SendAsync("ReceiveMessage", message, cancellationToken: ct);

        return Ok(message);
    }

    /// <summary>把對話裡客服傳來的訊息標為已讀</summary>
    [HttpPost("{chatRecordId:long}/read")]
    [SwaggerOperation(Summary = "標記對話已讀")]
    public async Task<IActionResult> MarkRead(long chatRecordId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, null, ct)) return Forbid();
        await _chatService.MarkAsReadAsync(chatRecordId, memberId, null, ct);
        await _hub.Clients.Group($"member:{memberId}").SendAsync("MessagesRead", new { chatRecordId }, cancellationToken: ct);
        return NoContent();
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
