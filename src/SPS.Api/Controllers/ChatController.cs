using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using SPS.Application.Interfaces.IServices;

namespace SPS.Api.Controllers;

/// <summary>
/// 聊天管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[SwaggerTag("聊天管理 API")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// 獲取所有在線訪客
    /// </summary>
    [HttpGet("visitors/online")]
    [SwaggerOperation(Summary = "獲取所有在線訪客", Description = "返回當前所有在線的訪客列表")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetOnlineVisitors()
    {
        try
        {
            var visitors = await _chatService.GetOnlineVisitorsAsync();
            return Ok(new
            {
                success = true,
                data = visitors,
                total = visitors.Count
            });
        }
        catch (TimeoutException ex)
        {
            // DB 超時時，嘗試只從 Redis 獲取
            _logger.LogWarning(ex, "DB timeout when getting online visitors");
            return StatusCode(500, new
            {
                success = false,
                message = "獲取在線訪客失敗（數據庫超時）"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting online visitors");
            return StatusCode(500, new
            {
                success = false,
                message = "獲取在線訪客失敗"
            });
        }
    }

    /// <summary>
    /// 獲取訪客會話詳情
    /// </summary>
    [HttpGet("visitors/{sessionId}")]
    [SwaggerOperation(Summary = "獲取訪客會話詳情", Description = "根據會話ID獲取訪客的詳細信息")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetVisitorSession(string sessionId)
    {
        try
        {
            var session = await _chatService.GetVisitorSessionAsync(sessionId);

            if (session == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "訪客會話不存在"
                });
            }

            return Ok(new
            {
                success = true,
                data = session
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visitor session {SessionId}", sessionId);
            return StatusCode(500, new
            {
                success = false,
                message = "獲取訪客會話失敗"
            });
        }
    }

    /// <summary>
    /// 獲取聊天歷史
    /// </summary>
    [HttpGet("messages/{sessionId}")]
    [SwaggerOperation(Summary = "獲取聊天歷史", Description = "獲取指定會話的聊天消息歷史")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetChatHistory(
        string sessionId,
        [FromQuery] int skip = 0,
        [FromQuery] int limit = 50)
    {
        try
        {
            var messages = await _chatService.GetChatHistoryAsync(sessionId, skip, limit);
            return Ok(new
            {
                success = true,
                data = messages,
                total = messages.Count
            });
        }
        catch (TimeoutException ex)
        {
            // DB 超時，返回空列表（非關鍵錯誤）
            _logger.LogWarning(ex, "DB timeout when getting chat history for session {SessionId}, returning empty list", sessionId);
            return Ok(new
            {
                success = true,
                data = new List<object>(),
                total = 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat history for session {SessionId}", sessionId);
            return StatusCode(500, new
            {
                success = false,
                message = "獲取聊天歷史失敗"
            });
        }
    }

    /// <summary>
    /// 獲取訪客頁面瀏覽歷史
    /// </summary>
    [HttpGet("pageviews/{sessionId}")]
    [SwaggerOperation(Summary = "獲取訪客頁面瀏覽歷史", Description = "獲取訪客的頁面訪問軌跡")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPageViewHistory(string sessionId)
    {
        try
        {
            var pageViews = await _chatService.GetPageViewHistoryAsync(sessionId);
            return Ok(new
            {
                success = true,
                data = pageViews,
                total = pageViews.Count
            });
        }
        catch (TimeoutException ex)
        {
            // DB 超時，返回空列表（非關鍵錯誤）
            _logger.LogWarning(ex, "DB timeout when getting page views for session {SessionId}, returning empty list", sessionId);
            return Ok(new
            {
                success = true,
                data = new List<object>(),
                total = 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting page view history for session {SessionId}", sessionId);
            return StatusCode(500, new
            {
                success = false,
                message = "獲取頁面瀏覽歷史失敗"
            });
        }
    }

    /// <summary>
    /// 獲取會話統計
    /// </summary>
    [HttpGet("statistics")]
    [SwaggerOperation(Summary = "獲取會話統計", Description = "獲取所有會話的統計信息")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var stats = await _chatService.GetSessionStatisticsAsync();
            return Ok(new
            {
                success = true,
                data = stats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session statistics");
            return StatusCode(500, new
            {
                success = false,
                message = "獲取統計信息失敗"
            });
        }
    }

    /// <summary>
    /// 獲取未讀消息數量
    /// </summary>
    [HttpGet("unread/{sessionId}")]
    [SwaggerOperation(Summary = "獲取未讀消息數量", Description = "獲取指定會話的未讀消息數量")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUnreadMessageCount(string sessionId)
    {
        try
        {
            var count = await _chatService.GetUnreadMessageCountAsync(sessionId);
            return Ok(new
            {
                success = true,
                data = new { sessionId, unreadCount = count }
            });
        }
        catch (TimeoutException ex)
        {
            // DB 超時，返回 0（非關鍵錯誤）
            _logger.LogWarning(ex, "DB timeout when getting unread count for session {SessionId}, returning 0", sessionId);
            return Ok(new
            {
                success = true,
                data = new { sessionId, unreadCount = 0 }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread message count for session {SessionId}", sessionId);
            return StatusCode(500, new
            {
                success = false,
                message = "獲取未讀消息數量失敗"
            });
        }
    }
}