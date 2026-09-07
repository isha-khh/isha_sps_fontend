using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 通知管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("通知管理控制器")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// 分頁查詢通知
    /// </summary>
    /// <param name="parameters">查詢參數</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分頁結果</returns>
    [HttpGet]
    [Authorize]
    [SwaggerOperation(Summary = "分頁查詢通知", Description = "取得通知列表，支援分頁和篩選")]
    [ProducesResponseType(typeof(PagedResult<NotificationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] NotificationQueryParameters parameters, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting paged notifications");
        var result = await _notificationService.GetPagedAsync(parameters, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 取得單一通知
    /// </summary>
    /// <param name="id">通知 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>通知詳情</returns>
    [HttpGet("{id}")]
    [Authorize]
    [SwaggerOperation(Summary = "取得單一通知", Description = "根據 ID 取得通知詳細資訊")]
    [ProducesResponseType(typeof(NotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting notification by ID: {NotificationId}", id);
        var result = await _notificationService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 新增通知
    /// </summary>
    /// <param name="request">新增請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新增的通知</returns>
    [HttpPost]
    [Authorize]
    [SwaggerOperation(Summary = "新增通知", Description = "建立新的通知")]
    [ProducesResponseType(typeof(NotificationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating notification for: {Recipient}", request.Recipient);
        var result = await _notificationService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// 標記通知為已讀
    /// </summary>
    /// <param name="id">通知 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    [HttpPut("{id}/read")]
    [Authorize]
    [SwaggerOperation(Summary = "標記通知為已讀", Description = "將指定通知標記為已讀狀態")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(long id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Marking notification as read: {NotificationId}", id);
        var result = await _notificationService.MarkAsReadAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(new { message = "通知已標記為已讀" });
    }

    /// <summary>
    /// 刪除通知
    /// </summary>
    /// <param name="id">通知 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>無內容</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [SwaggerOperation(Summary = "刪除通知", Description = "刪除指定的通知")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting notification: {NotificationId}", id);
        var result = await _notificationService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return NoContent();
    }

    /// <summary>
    /// 取得指定收件人的通知
    /// </summary>
    /// <param name="recipient">收件人識別碼</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>通知列表</returns>
    [HttpGet("recipient/{recipient}")]
    [Authorize]
    [SwaggerOperation(Summary = "取得指定收件人的通知", Description = "取得指定收件人的所有通知")]
    [ProducesResponseType(typeof(List<NotificationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetByRecipient(string recipient, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting notifications for recipient: {Recipient}", recipient);
        var result = await _notificationService.GetByRecipientAsync(recipient, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 取得指定收件人的未讀通知數量
    /// </summary>
    /// <param name="recipient">收件人識別碼</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>未讀數量</returns>
    [HttpGet("recipient/{recipient}/unread-count")]
    [Authorize]
    [SwaggerOperation(Summary = "取得未讀通知數量", Description = "取得指定收件人的未讀通知數量")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUnreadCount(string recipient, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting unread count for recipient: {Recipient}", recipient);
        var result = await _notificationService.GetUnreadCountAsync(recipient, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(new { count = result.Data });
    }
}
