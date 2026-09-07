using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Interceptors;

/// <summary>
/// EF Core SaveChanges 攔截器 - 自動記錄資料異動
/// </summary>
public class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditLogInterceptor> _logger;

    // 不記錄異動的實體類型
    private static readonly HashSet<Type> ExcludedTypes = new()
    {
        typeof(ActionLog),      // 避免遞迴
        typeof(MailLog),        // 郵件日誌
        typeof(ApplicationLog)  // 申請日誌
    };

    // 只記錄這些重要實體的異動
    private static readonly HashSet<Type> AuditedTypes = new()
    {
        typeof(User),
        typeof(Member),
        typeof(Company),
        typeof(MemberApplication),
        typeof(Role),
        typeof(UploadedFile),
        typeof(News),
        typeof(Banner),
        typeof(Album),
        typeof(Video),
        typeof(SuccessCase),
        typeof(Product),
        typeof(Demand),
        typeof(SystemSetting),
        typeof(About),
        typeof(Regulations),
        typeof(Mou),
        typeof(Category),
        typeof(SPS.Domain.Entities.Attribute)
    };

    public AuditLogInterceptor(IHttpContextAccessor httpContextAccessor, ILogger<AuditLogInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context == null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var auditEntries = GetAuditEntries(eventData.Context);
        if (auditEntries.Count > 0)
        {
            await SaveAuditLogs(eventData.Context, auditEntries, cancellationToken);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private List<AuditEntry> GetAuditEntries(DbContext context)
    {
        var auditEntries = new List<AuditEntry>();
        var httpContext = _httpContextAccessor.HttpContext;
        var user = httpContext?.User;

        var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? user?.FindFirst("UserId")?.Value
                     ?? user?.FindFirst("MemberId")?.Value;
        var userName = user?.FindFirst(ClaimTypes.Name)?.Value
                       ?? user?.FindFirst("Name")?.Value;

        // 判斷 userType：無 userId 時為匿名，有 MemberId 為 Member，否則為 Admin
        string userType;
        if (string.IsNullOrEmpty(userId))
        {
            userType = "Anonymous";
        }
        else if (user?.HasClaim(c => c.Type == "MemberId") == true)
        {
            userType = "Member";
        }
        else
        {
            userType = user?.FindFirst("UserType")?.Value ?? "Admin";
        }
        var ipAddress = GetClientIpAddress(httpContext);

        foreach (var entry in context.ChangeTracker.Entries())
        {
            var entityType = entry.Entity.GetType();

            // 跳過排除的類型
            if (ExcludedTypes.Contains(entityType))
                continue;

            // 只記錄允許的類型
            if (!AuditedTypes.Contains(entityType))
                continue;

            // 只記錄新增、修改、刪除
            if (entry.State != EntityState.Added &&
                entry.State != EntityState.Modified &&
                entry.State != EntityState.Deleted)
                continue;

            var auditEntry = new AuditEntry
            {
                EntityType = entityType.Name,
                EntityId = GetPrimaryKeyValue(entry),
                EntityName = GetEntityName(entry),
                ActionType = entry.State switch
                {
                    EntityState.Added => "Create",
                    EntityState.Modified => "Update",
                    EntityState.Deleted => "Delete",
                    _ => "Unknown"
                },
                UserId = userId,
                UserName = userName,
                UserType = userType,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow
            };

            auditEntries.Add(auditEntry);
        }

        return auditEntries;
    }

    private async Task SaveAuditLogs(DbContext context, List<AuditEntry> auditEntries, CancellationToken cancellationToken)
    {
        try
        {
            foreach (var entry in auditEntries)
            {
                var actionLog = new ActionLog
                {
                    ActionType = entry.ActionType,
                    ActionName = GetActionName(entry.ActionType),
                    UserType = entry.UserType,
                    UserId = entry.UserId,
                    UserName = entry.UserName,
                    EntityType = entry.EntityType,
                    EntityTypeName = GetEntityTypeName(entry.EntityType),
                    EntityId = entry.EntityId,
                    EntityName = entry.EntityName,
                    Description = $"{GetActionName(entry.ActionType)} {GetEntityTypeName(entry.EntityType)}: {entry.EntityName ?? entry.EntityId}",
                    IpAddress = entry.IpAddress,
                    IsSuccess = true,
                    CreatedTime = entry.Timestamp
                };

                context.Set<ActionLog>().Add(actionLog);
            }

            // 注意：這裡不 SaveChanges，因為會在原本的 SaveChanges 中一起保存
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit logs");
        }
    }

    private static string? GetPrimaryKeyValue(EntityEntry entry)
    {
        var keyProperties = entry.Metadata.FindPrimaryKey()?.Properties;
        if (keyProperties == null || keyProperties.Count == 0)
            return null;

        var keyValues = keyProperties
            .Select(p => entry.Property(p.Name).CurrentValue?.ToString())
            .Where(v => v != null);

        return string.Join(",", keyValues);
    }

    private static string? GetEntityName(EntityEntry entry)
    {
        // 嘗試取得常見的名稱屬性
        var nameProperties = new[] { "Name", "Title", "Subject", "FileName", "Account", "Email" };

        foreach (var propName in nameProperties)
        {
            var property = entry.Properties.FirstOrDefault(p =>
                p.Metadata.Name.Equals(propName, StringComparison.OrdinalIgnoreCase));

            if (property != null)
            {
                return property.CurrentValue?.ToString();
            }
        }

        return null;
    }

    private static string GetActionName(string actionType)
    {
        return actionType switch
        {
            "Create" => "新增",
            "Update" => "更新",
            "Delete" => "刪除",
            _ => actionType
        };
    }

    private static string GetEntityTypeName(string entityType)
    {
        return entityType switch
        {
            "User" => "後台使用者",
            "Member" => "會員",
            "Company" => "企業",
            "MemberApplication" => "會員申請",
            "Role" => "角色",
            "UploadedFile" => "檔案",
            "News" => "最新消息",
            "Banner" => "輪播圖",
            "Album" => "相簿",
            "Video" => "影片",
            "SuccessCase" => "成功案例",
            "Product" => "產品",
            "Demand" => "需求",
            "SystemSetting" => "系統設定",
            "About" => "關於內容",
            "Regulations" => "法規文件",
            "Mou" => "MOU 文件",
            "Category" => "分類",
            "Attribute" => "屬性",
            _ => entityType
        };
    }

    private static string? GetClientIpAddress(HttpContext? context)
    {
        if (context == null) return null;

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

/// <summary>
/// 審計日誌項目（內部使用）
/// </summary>
internal class AuditEntry
{
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserType { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}
