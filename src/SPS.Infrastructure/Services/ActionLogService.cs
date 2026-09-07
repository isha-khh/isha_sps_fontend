using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 操作日誌服務實作
/// </summary>
public class ActionLogService : IActionLogService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ActionLogService> _logger;

    public ActionLogService(ApplicationDbContext dbContext, ILogger<ActionLogService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 記錄操作日誌
    /// </summary>
    public async Task LogAsync(ActionLogEntry entry, CancellationToken cancellationToken = default)
    {
        try
        {
            var actionLog = new ActionLog
            {
                ActionType = entry.ActionType,
                ActionName = entry.ActionName ?? GetActionName(entry.ActionType),
                UserType = entry.UserType,
                UserId = entry.UserId,
                UserName = entry.UserName,
                EntityType = entry.EntityType,
                EntityTypeName = entry.EntityTypeName ?? GetEntityTypeName(entry.EntityType),
                EntityId = entry.EntityId,
                EntityName = entry.EntityName,
                Description = entry.Description,
                IpAddress = entry.IpAddress,
                UserAgent = entry.UserAgent,
                IsSuccess = entry.IsSuccess,
                ErrorMessage = entry.ErrorMessage,
                ExecutionDuration = entry.ExecutionDuration,
                CreatedTime = DateTime.UtcNow
            };

            _dbContext.Set<ActionLog>().Add(actionLog);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save action log");
        }
    }

    /// <summary>
    /// 記錄登入
    /// </summary>
    public async Task LogLoginAsync(string userId, string userName, string userType, bool isSuccess, string? loginMethod = "密碼", string? ipAddress = null, string? userAgent = null, string? errorMessage = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(new ActionLogEntry
        {
            ActionType = "Login",
            ActionName = "使用者登入",
            UserId = userId,
            UserName = userName,
            UserType = userType,
            EntityType = loginMethod,
            EntityTypeName = loginMethod,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage,
            Description = isSuccess ? $"{userName} 登入成功" : $"{userName} 登入失敗: {errorMessage}"
        }, cancellationToken);
    }

    /// <summary>
    /// 記錄登出
    /// </summary>
    public async Task LogLogoutAsync(string userId, string userName, string userType, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(new ActionLogEntry
        {
            ActionType = "Logout",
            ActionName = "使用者登出",
            UserId = userId,
            UserName = userName,
            UserType = userType,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccess = true,
            Description = $"{userName} 登出"
        }, cancellationToken);
    }

    /// <summary>
    /// 記錄資料建立
    /// </summary>
    public async Task LogCreateAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(new ActionLogEntry
        {
            ActionType = "Create",
            ActionName = "新增資料",
            UserId = userId,
            UserName = userName,
            UserType = userType,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            IpAddress = ipAddress,
            IsSuccess = true,
            Description = description ?? $"新增 {GetEntityTypeName(entityType)}: {entityName ?? entityId}"
        }, cancellationToken);
    }

    /// <summary>
    /// 記錄資料更新
    /// </summary>
    public async Task LogUpdateAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(new ActionLogEntry
        {
            ActionType = "Update",
            ActionName = "更新資料",
            UserId = userId,
            UserName = userName,
            UserType = userType,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            IpAddress = ipAddress,
            IsSuccess = true,
            Description = description ?? $"更新 {GetEntityTypeName(entityType)}: {entityName ?? entityId}"
        }, cancellationToken);
    }

    /// <summary>
    /// 記錄資料刪除
    /// </summary>
    public async Task LogDeleteAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        await LogAsync(new ActionLogEntry
        {
            ActionType = "Delete",
            ActionName = "刪除資料",
            UserId = userId,
            UserName = userName,
            UserType = userType,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            IpAddress = ipAddress,
            IsSuccess = true,
            Description = description ?? $"刪除 {GetEntityTypeName(entityType)}: {entityName ?? entityId}"
        }, cancellationToken);
    }

    /// <summary>
    /// 記錄 API 請求
    /// </summary>
    public async Task LogApiRequestAsync(ActionLogEntry entry, CancellationToken cancellationToken = default)
    {
        entry.ActionType = string.IsNullOrEmpty(entry.ActionType) ? "ApiRequest" : entry.ActionType;
        entry.ActionName ??= "API 請求";
        await LogAsync(entry, cancellationToken);
    }

    /// <summary>
    /// 取得動作名稱
    /// </summary>
    private static string GetActionName(string actionType)
    {
        return actionType switch
        {
            "Login" => "使用者登入",
            "Logout" => "使用者登出",
            "Create" => "新增資料",
            "Update" => "更新資料",
            "Delete" => "刪除資料",
            "View" => "檢視資料",
            "Export" => "匯出資料",
            "Import" => "匯入資料",
            "ApiRequest" => "API 請求",
            "Approve" => "審核通過",
            "Reject" => "審核拒絕",
            "Submit" => "提交",
            "Cancel" => "取消",
            "Upload" => "上傳檔案",
            "Download" => "下載檔案",
            "PasswordChange" => "變更密碼",
            "PasswordReset" => "重設密碼",
            _ => actionType
        };
    }

    /// <summary>
    /// 取得實體類型名稱
    /// </summary>
    private static string GetEntityTypeName(string? entityType)
    {
        if (string.IsNullOrEmpty(entityType)) return "未知";

        return entityType switch
        {
            "User" => "後台使用者",
            "Member" => "會員",
            "Company" => "企業",
            "MemberApplication" => "會員申請",
            "Role" => "角色",
            "UploadedFile" => "檔案",
            "Folder" => "資料夾",
            "News" => "最新消息",
            "Banner" => "輪播圖",
            "Album" => "相簿",
            "Video" => "影片",
            "SuccessCase" => "成功案例",
            "Product" => "產品",
            "Demand" => "需求",
            "SystemSetting" => "系統設定",
            _ => entityType
        };
    }
}
