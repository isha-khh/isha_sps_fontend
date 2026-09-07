using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Chat;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

[ApiController]
[Route("api/admin/member-chat")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("管理員聊天控制器")]
public class AdminMemberChatController : ControllerBase
{
    private readonly IMemberChatService _chatService;

    public AdminMemberChatController(IMemberChatService chatService)
    {
        _chatService = chatService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("UserId not found in claims.");
        return id;
    }

    [HttpGet("list")]
    [SwaggerOperation(Summary = "取得管理員聊天列表")]
    public async Task<ActionResult<List<ChatRecordDto>>> GetChatList(CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _chatService.GetChatListForAdminAsync(userId, ct);
        return Ok(result);
    }

    [HttpGet("{chatRecordId:long}/messages")]
    [SwaggerOperation(Summary = "取得聊天訊息歷史")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(long chatRecordId, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, null, userId, ct))
            return Forbid();

        var result = await _chatService.GetMessagesAsync(chatRecordId, skip, take, ct);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    [SwaggerOperation(Summary = "取得總未讀數")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var userId = GetUserId();
        var count = await _chatService.GetTotalUnreadCountAsync(null, userId, ct);
        return Ok(count);
    }

    [HttpGet("waiting")]
    [SwaggerOperation(Summary = "取得待領收聊天列表")]
    public async Task<ActionResult<List<ChatRecordDto>>> GetWaitingChats(CancellationToken ct)
    {
        var result = await _chatService.GetWaitingChatsAsync(ct);
        return Ok(result);
    }

    [HttpPost("{id:long}/claim")]
    [SwaggerOperation(Summary = "領收聊天")]
    public async Task<ActionResult<ChatRecordDto>> ClaimChat(long id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var result = await _chatService.ClaimChatAsync(id, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:long}/leave")]
    [SwaggerOperation(Summary = "離開聊天")]
    public async Task<ActionResult<ChatRecordDto>> LeaveChat(long id, CancellationToken ct)
    {
        var userId = GetUserId();
        try
        {
            var result = await _chatService.LeaveChatAsync(id, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
