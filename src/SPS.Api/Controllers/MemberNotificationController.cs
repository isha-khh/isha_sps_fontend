using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.MemberNotification;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 前台會員的收件匣（站內通知）：回應審核結果、收到的回應、新需求媒合、詢問單回覆。
/// 只能讀寫自己的通知，會員身分一律從 token 的 MemberId 取得。
/// </summary>
[ApiController]
[Route("api/member/notifications")]
[Produces("application/json")]
[SwaggerTag("會員收件匣")]
public class MemberNotificationController : ControllerBase
{
    private readonly IMemberNotificationService _notifications;
    private readonly IMemberChatService _chat;

    public MemberNotificationController(IMemberNotificationService notifications, IMemberChatService chat)
    {
        _notifications = notifications;
        _chat = chat;
    }

    private Guid? GetMemberId() => Guid.TryParse(User.FindFirst("MemberId")?.Value, out var id) ? id : null;

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(MemberNotificationListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList([FromQuery] bool unreadOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        return Ok(await _notifications.GetListAsync(memberId.Value, unreadOnly, page, pageSize, ct));
    }

    /// <summary>
    /// 未讀數，給頁首的收件匣小圖示用：<c>unreadCount</c> 是系統通知、<c>chatUnreadCount</c> 是客服對話裡客服傳來還沒讀的訊息。
    /// **沒登入也可以呼叫**（回 0），避免匿名頁面載入時被 401 導去登入頁
    /// </summary>
    [HttpGet("unread-count")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Ok(new { unreadCount = 0, chatUnreadCount = 0 });
        return Ok(new
        {
            unreadCount = await _notifications.GetUnreadCountAsync(memberId.Value, ct),
            chatUnreadCount = await _chat.GetTotalUnreadCountAsync(memberId.Value, null, ct),
        });
    }

    [HttpPost("{id:long}/read")]
    [Authorize]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        await _notifications.MarkReadAsync(memberId.Value, id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    [Authorize]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        await _notifications.MarkAllReadAsync(memberId.Value, ct);
        return NoContent();
    }
}
