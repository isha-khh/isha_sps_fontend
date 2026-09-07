using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SPS.Application.Interfaces.IServices;

namespace SPS.Api.Attributes;

/// <summary>
/// 操作日誌 Attribute - 標記需要記錄日誌的 Action
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class ActionLogAttribute : Attribute
{
    /// <summary>
    /// 動作類型
    /// </summary>
    public string ActionType { get; set; } = "ApiRequest";

    /// <summary>
    /// 動作名稱（中文描述）
    /// </summary>
    public string? ActionName { get; set; }

    /// <summary>
    /// 實體類型
    /// </summary>
    public string? EntityType { get; set; }

    /// <summary>
    /// 是否記錄（可在運行時禁用）
    /// </summary>
    public bool IsEnabled { get; set; } = true;
}

/// <summary>
/// 全域操作日誌 Filter - 自動記錄 API 請求
/// </summary>
public class ActionLogFilter : IAsyncActionFilter
{
    private readonly IActionLogService _actionLogService;
    private readonly ILogger<ActionLogFilter> _logger;

    // 不記錄日誌的路徑（避免遞迴或不重要的請求）
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/Log",           // 日誌 API 本身
        "/api/health",        // 健康檢查
        "/api/swagger",       // Swagger
        "/swagger",
        "/favicon.ico"
    };

    // 只記錄這些 HTTP 方法的請求（GET 通常太多）
    private static readonly HashSet<string> LoggedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    public ActionLogFilter(IActionLogService actionLogService, ILogger<ActionLogFilter> logger)
    {
        _actionLogService = actionLogService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var request = httpContext.Request;
        var path = request.Path.Value ?? "";

        // 檢查是否在排除清單中
        if (ExcludedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await next();
            return;
        }

        // 檢查是否有 ActionLogAttribute
        var actionLogAttr = context.ActionDescriptor.EndpointMetadata
            .OfType<ActionLogAttribute>()
            .FirstOrDefault();

        // 如果明確標記不記錄，跳過
        if (actionLogAttr is { IsEnabled: false })
        {
            await next();
            return;
        }

        // 如果沒有標記且不是記錄的 HTTP 方法，跳過
        if (actionLogAttr == null && !LoggedMethods.Contains(request.Method))
        {
            await next();
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var executedContext = await next();
        stopwatch.Stop();

        // 記錄日誌
        try
        {
            var user = httpContext.User;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? user.FindFirst("UserId")?.Value
                         ?? user.FindFirst("MemberId")?.Value;
            var userName = user.FindFirst(ClaimTypes.Name)?.Value
                           ?? user.FindFirst("Name")?.Value;

            // 判斷 userType：無 userId 時為匿名，有 MemberId 為 Member，否則為 Admin
            string userType;
            if (string.IsNullOrEmpty(userId))
            {
                userType = "Anonymous";
            }
            else if (user.HasClaim(c => c.Type == "MemberId"))
            {
                userType = "Member";
            }
            else
            {
                userType = user.FindFirst("UserType")?.Value ?? "Admin";
            }

            // 取得 Entity ID（從路由或請求參數）
            string? entityId = null;
            if (context.RouteData.Values.TryGetValue("id", out var routeId))
            {
                entityId = routeId?.ToString();
            }
            else if (context.ActionArguments.TryGetValue("id", out var argId))
            {
                entityId = argId?.ToString();
            }

            var isSuccess = executedContext.Exception == null &&
                            executedContext.Result is not ObjectResult { StatusCode: >= 400 };

            var entry = new ActionLogEntry
            {
                ActionType = actionLogAttr?.ActionType ?? GetActionTypeFromMethod(request.Method),
                ActionName = actionLogAttr?.ActionName ?? GetActionNameFromPath(path, request.Method),
                UserType = userType,
                UserId = userId,
                UserName = userName,
                EntityType = actionLogAttr?.EntityType ?? GetEntityTypeFromPath(path),
                EntityId = entityId,
                Description = $"{request.Method} {path}",
                IpAddress = GetClientIpAddress(httpContext),
                UserAgent = request.Headers.UserAgent.ToString(),
                IsSuccess = isSuccess,
                ErrorMessage = executedContext.Exception?.Message,
                ExecutionDuration = stopwatch.ElapsedMilliseconds
            };

            await _actionLogService.LogApiRequestAsync(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log action");
        }
    }

    private static string GetActionTypeFromMethod(string method)
    {
        return method.ToUpper() switch
        {
            "POST" => "Create",
            "PUT" => "Update",
            "PATCH" => "Update",
            "DELETE" => "Delete",
            "GET" => "View",
            _ => "ApiRequest"
        };
    }

    private static string GetActionNameFromPath(string path, string method)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var entityType = segments.Length > 1 ? segments[1] : "資源";

        return method.ToUpper() switch
        {
            "POST" => $"新增{entityType}",
            "PUT" => $"更新{entityType}",
            "PATCH" => $"更新{entityType}",
            "DELETE" => $"刪除{entityType}",
            "GET" => $"查詢{entityType}",
            _ => $"{method} {entityType}"
        };
    }

    private static string? GetEntityTypeFromPath(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // /api/Controller/... -> Controller is the entity type
        if (segments.Length > 1)
        {
            var controller = segments[1];
            // Remove "Controller" suffix if present
            return controller.Replace("Controller", "");
        }
        return null;
    }

    private static string? GetClientIpAddress(HttpContext context)
    {
        // Check for forwarded headers (reverse proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}
