using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Chat;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

[ApiController]
[Route("api/member-chat")]
[Authorize]
[Produces("application/json")]
[SwaggerTag("會員聊天控制器")]
public class MemberChatController : ControllerBase
{
    private readonly IMemberChatService _chatService;

    public MemberChatController(IMemberChatService chatService)
    {
        _chatService = chatService;
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
        var memberId = GetMemberId();
        if (!await _chatService.IsParticipantAsync(chatRecordId, memberId, null, ct))
            return Forbid();

        var result = await _chatService.GetMessagesAsync(chatRecordId, skip, take, ct);
        return Ok(result);
    }

    [HttpPost("create")]
    [SwaggerOperation(Summary = "建立會員對會員聊天")]
    public async Task<ActionResult<ChatRecordDto>> CreateChat([FromBody] CreateChatRequest request, CancellationToken ct)
    {
        var memberId = GetMemberId();
        var result = await _chatService.GetOrCreateMemberChatAsync(memberId, request.TargetMemberId, ct);
        return Ok(result);
    }

    [HttpPost("create-admin")]
    [SwaggerOperation(Summary = "建立會員對客服聊天（待領收）")]
    public async Task<ActionResult<ChatRecordDto>> CreateAdminChat(CancellationToken ct)
    {
        var memberId = GetMemberId();
        var result = await _chatService.CreateCustomerServiceChatAsync(memberId, ct);
        return Ok(result);
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
