using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Log;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 系統日誌查詢控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("系統日誌查詢控制器")]
[Authorize]
public class LogController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LogController> _logger;

    public LogController(ApplicationDbContext context, ILogger<LogController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 獲取操作日誌統計資料
    /// </summary>
    /// <param name="startDate">開始日期</param>
    /// <param name="endDate">結束日期</param>
    /// <param name="cancellationToken">取消令牌</param>
    [HttpGet("action/statistics")]
    [ProducesResponseType(typeof(ActionLogStatisticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetActionLogStatistics(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken cancellationToken = default)
    {
        if (!CheckPermission(UserPermission.ViewAnalytics))
            return Forbid();

        _logger.LogInformation("Getting action log statistics");

        var query = _context.Set<ActionLog>().AsQueryable();

        // 日期篩選 (使用 UTC 時間)
        if (startDate.HasValue)
        {
            var startDateTime = DateTime.SpecifyKind(
                startDate.Value.ToDateTime(TimeOnly.MinValue),
                DateTimeKind.Utc);
            query = query.Where(l => l.CreatedTime >= startDateTime);
        }

        if (endDate.HasValue)
        {
            var endDateTime = DateTime.SpecifyKind(
                endDate.Value.ToDateTime(TimeOnly.MaxValue),
                DateTimeKind.Utc);
            query = query.Where(l => l.CreatedTime <= endDateTime);
        }

        // 基本統計
        var totalCount = await query.CountAsync(cancellationToken);
        var successCount = await query.CountAsync(l => l.IsSuccess, cancellationToken);
        var failureCount = totalCount - successCount;

        // 平均執行時間
        var avgDuration = totalCount > 0
            ? await query.Where(l => l.ExecutionDuration.HasValue)
                .AverageAsync(l => (double?)l.ExecutionDuration, cancellationToken) ?? 0
            : 0;

        // 操作類型分佈
        var actionTypeDistribution = await query
            .Where(l => l.ActionType != null)
            .GroupBy(l => l.ActionType!)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        // 實體類型分佈
        var entityTypeDistribution = await query
            .Where(l => l.EntityTypeName != null)
            .GroupBy(l => l.EntityTypeName!)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        // 每日趨勢
        var dailyTrend = await query
            .GroupBy(l => l.CreatedTime.Date)
            .Select(g => new ActionLogDailyTrendItem
            {
                Date = DateOnly.FromDateTime(g.Key),
                Total = g.Count(),
                Success = g.Count(l => l.IsSuccess),
                Failure = g.Count(l => !l.IsSuccess)
            })
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);

        var result = new ActionLogStatisticsDto
        {
            TotalCount = totalCount,
            SuccessCount = successCount,
            FailureCount = failureCount,
            AvgExecutionDuration = Math.Round(avgDuration, 2),
            ActionTypeDistribution = actionTypeDistribution,
            EntityTypeDistribution = entityTypeDistribution,
            DailyTrend = dailyTrend
        };

        return Ok(result);
    }

    /// <summary>
    /// 分頁查詢操作日誌
    /// </summary>
    [HttpGet("action")]
    [ProducesResponseType(typeof(PagedResult<ActionLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActionLogs(
        [FromQuery] QueryParameters parameters,
        [FromQuery] string? userId = null,
        [FromQuery] string? actionType = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting action logs");

        var query = _context.Set<ActionLog>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(l => l.UserId == userId);

        if (!string.IsNullOrWhiteSpace(actionType))
            query = query.Where(l => l.ActionType == actionType);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(l =>
                (l.ActionName != null && l.ActionName.Contains(parameters.Search)) ||
                (l.UserName != null && l.UserName.Contains(parameters.Search)) ||
                (l.EntityName != null && l.EntityName.Contains(parameters.Search)));

        var totalCount = await query.CountAsync(cancellationToken);

        query = parameters.Descending
            ? query.OrderByDescending(l => l.CreatedTime)
            : query.OrderBy(l => l.CreatedTime);

        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(l => new ActionLogDto
            {
                Id = l.Id,
                ActionType = l.ActionType,
                ActionName = l.ActionName,
                UserId = l.UserId,
                UserName = l.UserName,
                UserType = l.UserType,
                EntityType = l.EntityType,
                EntityTypeName = l.EntityTypeName,
                EntityId = l.EntityId,
                EntityName = l.EntityName,
                Description = l.Description,
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                ExecutionDuration = l.ExecutionDuration,
                CreatedTime = l.CreatedTime
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<ActionLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        });
    }

    /// <summary>
    /// 分頁查詢申請日誌
    /// </summary>
    [HttpGet("application")]
    [ProducesResponseType(typeof(PagedResult<ApplicationLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApplicationLogs(
        [FromQuery] QueryParameters parameters,
        [FromQuery] Guid? applicationId = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting application logs");

        var query = _context.Set<ApplicationLog>().AsQueryable();

        if (applicationId.HasValue)
            query = query.Where(l => l.ApplicationId == applicationId.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(l =>
                (l.Action != null && l.Action.Contains(parameters.Search)) ||
                (l.Comment != null && l.Comment.Contains(parameters.Search)));

        var totalCount = await query.CountAsync(cancellationToken);

        query = parameters.Descending
            ? query.OrderByDescending(l => l.OperatedAt)
            : query.OrderBy(l => l.OperatedAt);

        // 先獲取日誌資料
        var logs = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        // 獲取操作者名稱
        var operatorIds = logs
            .Where(l => l.OperatorId.HasValue)
            .Select(l => l.OperatorId!.Value)
            .Distinct()
            .ToList();

        var operators = await _context.Set<User>()
            .Where(u => operatorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name })
            .ToDictionaryAsync(u => u.Id, u => u.Name, cancellationToken);

        var items = logs.Select(l => new ApplicationLogDto
        {
            Id = l.Id,
            ApplicationId = l.ApplicationId,
            OperatorId = l.OperatorId,
            OperatorName = l.OperatorId.HasValue && operators.TryGetValue(l.OperatorId.Value, out var name) ? name : null,
            Action = l.Action,
            Comment = l.Comment,
            PreviousStatus = l.FromStatus.HasValue ? (int)l.FromStatus.Value : null,
            NewStatus = l.ToStatus.HasValue ? (int)l.ToStatus.Value : 0,
            IpAddress = l.IpAddress,
            OperatedAt = l.OperatedAt
        }).ToList();

        return Ok(new PagedResult<ApplicationLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        });
    }

    /// <summary>
    /// 分頁查詢郵件發送日誌
    /// </summary>
    [HttpGet("mail")]
    [ProducesResponseType(typeof(PagedResult<MailLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMailLogs(
        [FromQuery] MailLogQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        if (!CheckPermission(UserPermission.ManageMailLogs))
            return Forbid();

        _logger.LogInformation("Getting mail logs");

        var query = _context.Set<MailLog>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
            query = query.Where(l =>
                (l.Receivers != null && l.Receivers.Contains(parameters.Search)) ||
                (l.Subject != null && l.Subject.Contains(parameters.Search)));

        if (!string.IsNullOrWhiteSpace(parameters.MailType))
            query = query.Where(l => l.MailType == parameters.MailType);

        if (parameters.IsSuccess.HasValue)
            query = query.Where(l => l.IsSuccess == parameters.IsSuccess.Value);

        if (parameters.BounceStatus.HasValue)
            query = query.Where(l => (int)l.BounceStatus == parameters.BounceStatus.Value);
        else if (parameters.BouncedOnly == true)
            query = query.Where(l => l.BounceStatus != BounceStatus.None);

        if (parameters.DateFrom.HasValue)
        {
            var from = DateTime.SpecifyKind(parameters.DateFrom.Value, DateTimeKind.Utc);
            query = query.Where(l => (l.Time ?? l.CreatedTime) >= from);
        }

        if (parameters.DateTo.HasValue)
        {
            var to = DateTime.SpecifyKind(parameters.DateTo.Value, DateTimeKind.Utc);
            query = query.Where(l => (l.Time ?? l.CreatedTime) <= to);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = parameters.Descending
            ? query.OrderByDescending(l => l.Time ?? l.CreatedTime)
            : query.OrderBy(l => l.Time ?? l.CreatedTime);

        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(l => new MailLogDto
            {
                Id = l.Id,
                Subject = l.Subject,
                Receivers = l.Receivers,
                ReceiverCount = l.ReceiverCount,
                MailType = l.MailType,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                Time = l.Time,
                CreatedTime = l.CreatedTime,
                MessageId = l.MessageId,
                BounceStatus = (int)l.BounceStatus,
                BounceStatusText = l.BounceStatus == BounceStatus.None ? null :
                    l.BounceStatus == BounceStatus.HardBounce ? "硬退信" : "軟退信",
                BounceCode = l.BounceCode,
                BounceReason = l.BounceReason,
                BounceTime = l.BounceTime
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<MailLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        });
    }

    /// <summary>
    /// 導出操作日誌
    /// </summary>
    /// <param name="startDate">開始日期</param>
    /// <param name="endDate">結束日期</param>
    /// <param name="limit">筆數限制（預設 1000，最大 10000）</param>
    /// <param name="format">格式：json、csv、excel（預設 json）</param>
    /// <param name="userId">使用者 ID 篩選</param>
    /// <param name="actionType">操作類型篩選</param>
    /// <param name="cancellationToken">取消令牌</param>
    [HttpGet("action/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportActionLogs(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] int limit = 1000,
        [FromQuery] string format = "json",
        [FromQuery] string? userId = null,
        [FromQuery] string? actionType = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Exporting action logs in {Format} format", format);

        // 限制最大筆數
        limit = Math.Min(Math.Max(1, limit), 10000);

        var query = _context.Set<ActionLog>().AsQueryable();

        // 日期篩選 (使用 UTC 時間)
        if (startDate.HasValue)
        {
            var startDateTime = DateTime.SpecifyKind(
                startDate.Value.ToDateTime(TimeOnly.MinValue),
                DateTimeKind.Utc);
            query = query.Where(l => l.CreatedTime >= startDateTime);
        }

        if (endDate.HasValue)
        {
            var endDateTime = DateTime.SpecifyKind(
                endDate.Value.ToDateTime(TimeOnly.MaxValue),
                DateTimeKind.Utc);
            query = query.Where(l => l.CreatedTime <= endDateTime);
        }

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(l => l.UserId == userId);

        if (!string.IsNullOrWhiteSpace(actionType))
            query = query.Where(l => l.ActionType == actionType);

        var items = await query
            .OrderByDescending(l => l.CreatedTime)
            .Take(limit)
            .Select(l => new ActionLogDto
            {
                Id = l.Id,
                ActionType = l.ActionType,
                ActionName = l.ActionName,
                UserId = l.UserId,
                UserName = l.UserName,
                UserType = l.UserType,
                EntityType = l.EntityType,
                EntityTypeName = l.EntityTypeName,
                EntityId = l.EntityId,
                EntityName = l.EntityName,
                Description = l.Description,
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                ExecutionDuration = l.ExecutionDuration,
                CreatedTime = l.CreatedTime
            })
            .ToListAsync(cancellationToken);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return format.ToLower() switch
        {
            "csv" => ExportToCsv(items, $"action-logs-{timestamp}.csv"),
            "excel" => ExportToExcel(items, $"action-logs-{timestamp}.xlsx"),
            _ => ExportToJson(items, $"action-logs-{timestamp}.json")
        };
    }

    private FileContentResult ExportToJson(List<ActionLogDto> items, string fileName)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(items, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });
        return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", fileName);
    }

    private FileContentResult ExportToCsv(List<ActionLogDto> items, string fileName)
    {
        var sb = new System.Text.StringBuilder();

        // CSV Header
        sb.AppendLine("Id,操作類型,操作名稱,使用者ID,使用者名稱,使用者類型,實體類型,實體類型名稱,實體ID,實體名稱,描述,IP位址,成功,錯誤訊息,執行時間(ms),建立時間");

        // CSV Data
        foreach (var item in items)
        {
            sb.AppendLine(string.Join(",",
                item.Id,
                EscapeCsv(item.ActionType),
                EscapeCsv(item.ActionName),
                EscapeCsv(item.UserId),
                EscapeCsv(item.UserName),
                EscapeCsv(item.UserType),
                EscapeCsv(item.EntityType),
                EscapeCsv(item.EntityTypeName),
                EscapeCsv(item.EntityId),
                EscapeCsv(item.EntityName),
                EscapeCsv(item.Description),
                EscapeCsv(item.IpAddress),
                item.IsSuccess ? "是" : "否",
                EscapeCsv(item.ErrorMessage),
                item.ExecutionDuration?.ToString() ?? "",
                item.CreatedTime.ToString("yyyy-MM-dd HH:mm:ss")
            ));
        }

        // UTF-8 with BOM for Excel compatibility
        var preamble = System.Text.Encoding.UTF8.GetPreamble();
        var content = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + content.Length];
        preamble.CopyTo(result, 0);
        content.CopyTo(result, preamble.Length);

        return File(result, "text/csv", fileName);
    }

    private FileContentResult ExportToExcel(List<ActionLogDto> items, string fileName)
    {
        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("操作日誌");

        // Headers
        var headers = new[] { "Id", "操作類型", "操作名稱", "使用者ID", "使用者名稱", "使用者類型",
            "實體類型", "實體類型名稱", "實體ID", "實體名稱", "描述", "IP位址",
            "成功", "錯誤訊息", "執行時間(ms)", "建立時間" };

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
        }

        // Data
        for (int row = 0; row < items.Count; row++)
        {
            var item = items[row];
            var r = row + 2;
            worksheet.Cell(r, 1).Value = item.Id;
            worksheet.Cell(r, 2).Value = item.ActionType ?? "";
            worksheet.Cell(r, 3).Value = item.ActionName ?? "";
            worksheet.Cell(r, 4).Value = item.UserId ?? "";
            worksheet.Cell(r, 5).Value = item.UserName ?? "";
            worksheet.Cell(r, 6).Value = item.UserType ?? "";
            worksheet.Cell(r, 7).Value = item.EntityType ?? "";
            worksheet.Cell(r, 8).Value = item.EntityTypeName ?? "";
            worksheet.Cell(r, 9).Value = item.EntityId ?? "";
            worksheet.Cell(r, 10).Value = item.EntityName ?? "";
            worksheet.Cell(r, 11).Value = item.Description ?? "";
            worksheet.Cell(r, 12).Value = item.IpAddress ?? "";
            worksheet.Cell(r, 13).Value = item.IsSuccess ? "是" : "否";
            worksheet.Cell(r, 14).Value = item.ErrorMessage ?? "";
            worksheet.Cell(r, 15).Value = item.ExecutionDuration ?? 0;
            worksheet.Cell(r, 16).Value = item.CreatedTime;
            worksheet.Cell(r, 16).Style.DateFormat.Format = "yyyy-MM-dd HH:mm:ss";
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    /// <summary>
    /// 獲取操作日誌詳情
    /// </summary>
    [HttpGet("action/{id}")]
    [ProducesResponseType(typeof(ActionLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActionLogById(long id, CancellationToken cancellationToken)
    {
        var log = await _context.Set<ActionLog>()
            .Where(l => l.Id == id)
            .Select(l => new ActionLogDto
            {
                Id = l.Id,
                ActionType = l.ActionType,
                ActionName = l.ActionName,
                UserId = l.UserId,
                UserName = l.UserName,
                UserType = l.UserType,
                EntityType = l.EntityType,
                EntityTypeName = l.EntityTypeName,
                EntityId = l.EntityId,
                EntityName = l.EntityName,
                Description = l.Description,
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                ExecutionDuration = l.ExecutionDuration,
                CreatedTime = l.CreatedTime
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (log == null)
            return NotFound(new { error = "操作日誌不存在" });

        return Ok(log);
    }

    /// <summary>
    /// 獲取申請日誌詳情
    /// </summary>
    [HttpGet("application/{id}")]
    [ProducesResponseType(typeof(ApplicationLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplicationLogById(Guid id, CancellationToken cancellationToken)
    {
        var log = await _context.Set<ApplicationLog>().FindAsync(new object[] { id }, cancellationToken);
        if (log == null)
            return NotFound(new { error = "申請日誌不存在" });

        string? operatorName = null;
        if (log.OperatorId.HasValue)
        {
            operatorName = await _context.Set<User>()
                .Where(u => u.Id == log.OperatorId.Value)
                .Select(u => u.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var dto = new ApplicationLogDto
        {
            Id = log.Id,
            ApplicationId = log.ApplicationId,
            OperatorId = log.OperatorId,
            OperatorName = operatorName,
            Action = log.Action,
            Comment = log.Comment,
            PreviousStatus = log.FromStatus.HasValue ? (int)log.FromStatus.Value : null,
            NewStatus = log.ToStatus.HasValue ? (int)log.ToStatus.Value : 0,
            IpAddress = log.IpAddress,
            OperatedAt = log.OperatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// 獲取郵件日誌詳情
    /// </summary>
    [HttpGet("mail/{id}")]
    [ProducesResponseType(typeof(MailLogDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMailLogById(int id, CancellationToken cancellationToken)
    {
        if (!CheckPermission(UserPermission.ManageMailLogs))
            return Forbid();

        var log = await _context.Set<MailLog>()
            .Where(l => l.Id == id)
            .Select(l => new MailLogDetailDto
            {
                Id = l.Id,
                Subject = l.Subject,
                Receivers = l.Receivers,
                ReceiverCount = l.ReceiverCount,
                Content = l.Content,
                MailType = l.MailType,
                IsSuccess = l.IsSuccess,
                ErrorMessage = l.ErrorMessage,
                Time = l.Time,
                CreatedTime = l.CreatedTime,
                MessageId = l.MessageId,
                BounceStatus = (int)l.BounceStatus,
                BounceStatusText = l.BounceStatus == BounceStatus.None ? null :
                    l.BounceStatus == BounceStatus.HardBounce ? "硬退信" : "軟退信",
                BounceCode = l.BounceCode,
                BounceReason = l.BounceReason,
                BounceTime = l.BounceTime,
                RemoteMta = l.RemoteMta
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (log == null)
            return NotFound(new { error = "郵件日誌不存在" });

        return Ok(log);
    }

    /// <summary>
    /// 記錄退信
    /// </summary>
    /// <remarks>
    /// 用於記錄郵件退信資訊。可透過 Message-ID 精確匹配，或透過收件人郵箱匹配最近的郵件。
    /// </remarks>
    [HttpPost("mail/bounce")]
    [AllowAnonymous] // 允許郵件伺服器 webhook 呼叫
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordBounce(
        [FromBody] Application.DTOs.Log.RecordBounceRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Recording bounce for {Email}, Code: {Code}, Reason: {Reason}",
            request.RecipientEmail, request.BounceCode, request.BounceReason);

        MailLog? mailLog = null;

        // 優先使用 Message-ID 精確匹配
        if (!string.IsNullOrEmpty(request.OriginalMessageId))
        {
            mailLog = await _context.Set<MailLog>()
                .FirstOrDefaultAsync(l => l.MessageId == request.OriginalMessageId, cancellationToken);
        }

        // 若無 Message-ID，則用收件人郵箱匹配最近 24 小時內的郵件
        if (mailLog == null && !string.IsNullOrEmpty(request.RecipientEmail))
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);
            mailLog = await _context.Set<MailLog>()
                .Where(l => l.Receivers != null &&
                            l.Receivers.Contains(request.RecipientEmail) &&
                            l.CreatedTime >= cutoff &&
                            l.BounceStatus == BounceStatus.None)
                .OrderByDescending(l => l.CreatedTime)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (mailLog == null)
        {
            _logger.LogWarning("No matching mail log found for bounce: {Email}", request.RecipientEmail);
            return NotFound(new { error = "找不到對應的郵件記錄" });
        }

        // 更新退信資訊
        mailLog.BounceStatus = request.BounceType?.ToLower() switch
        {
            "softbounce" or "soft" => BounceStatus.SoftBounce,
            _ => BounceStatus.HardBounce
        };
        mailLog.BounceCode = request.BounceCode;
        mailLog.BounceReason = request.BounceReason;
        mailLog.BounceTime = request.BounceTime ?? DateTime.UtcNow;
        mailLog.RemoteMta = request.RemoteMta;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bounce recorded for mail log {Id}", mailLog.Id);

        return Ok(new { message = "退信已記錄", mailLogId = mailLog.Id });
    }

    /// <summary>
    /// 檢查當前用戶是否擁有指定權限
    /// </summary>
    private bool CheckPermission(UserPermission requiredPermission)
    {
        var permsClaim = User.FindFirst("Permissions")?.Value;
        if (long.TryParse(permsClaim, out var perms))
        {
            var userPermissions = (UserPermission)perms;
            if (userPermissions.HasFlag(UserPermission.All)) return true;
            return userPermissions.HasFlag(requiredPermission);
        }
        return false;
    }
}

#region DTOs

/// <summary>
/// 操作日誌 DTO
/// </summary>
public class ActionLogDto
{
    public long Id { get; set; }
    public string? ActionType { get; set; }
    public string? ActionName { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserType { get; set; }
    public string? EntityType { get; set; }
    public string? EntityTypeName { get; set; }
    public string? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? Description { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public long? ExecutionDuration { get; set; }
    public DateTime CreatedTime { get; set; }
}

/// <summary>
/// 申請日誌 DTO
/// </summary>
public class ApplicationLogDto
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid? OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string? Action { get; set; }
    public string? Comment { get; set; }
    public int? PreviousStatus { get; set; }
    public int NewStatus { get; set; }
    public string? IpAddress { get; set; }
    public DateTime OperatedAt { get; set; }
}

/// <summary>
/// 郵件日誌查詢參數
/// </summary>
public class MailLogQueryParameters : QueryParameters
{
    /// <summary>
    /// 郵件類型篩選（例如 PasswordReset、Verification、Notification）
    /// </summary>
    public string? MailType { get; set; }

    /// <summary>
    /// 是否成功
    /// </summary>
    public bool? IsSuccess { get; set; }

    /// <summary>
    /// 退信狀態：0=None, 1=HardBounce, 2=SoftBounce
    /// </summary>
    public int? BounceStatus { get; set; }

    /// <summary>
    /// 是否只顯示已退信記錄（BounceStatus != None）。若同時傳 BounceStatus 則以 BounceStatus 為準
    /// </summary>
    public bool? BouncedOnly { get; set; }

    /// <summary>
    /// 起始時間（含），以 Time 欄位為主，無則以 CreatedTime 為準
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// 結束時間（含）
    /// </summary>
    public DateTime? DateTo { get; set; }
}

/// <summary>
/// 郵件日誌 DTO
/// </summary>
public class MailLogDto
{
    public int Id { get; set; }
    public string? Subject { get; set; }
    public string? Receivers { get; set; }
    public int ReceiverCount { get; set; }
    public string? MailType { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? Time { get; set; }
    public DateTime CreatedTime { get; set; }
    public string? MessageId { get; set; }
    public int BounceStatus { get; set; }
    public string? BounceStatusText { get; set; }
    public string? BounceCode { get; set; }
    public string? BounceReason { get; set; }
    public DateTime? BounceTime { get; set; }
}

/// <summary>
/// 郵件日誌詳細 DTO（包含內容）
/// </summary>
public class MailLogDetailDto : MailLogDto
{
    public string? Content { get; set; }
    public string? RemoteMta { get; set; }
}

#endregion
