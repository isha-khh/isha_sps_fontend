using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 後台使用者信息
/// </summary>
public class AdminUserInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public string? Email { get; set; }
    public Guid? AvatarFileId { get; set; }
    public string? AvatarUrl { get; set; }
    public List<RoleInfo> Roles { get; set; } = new();
    public UserPermission Permissions { get; set; }
}

/// <summary>
/// 角色信息
/// </summary>
public class RoleInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public UserPermission Permissions { get; set; }
}

/// <summary>
/// 後台 Token 響應
/// </summary>
public class AdminTokenResponse
{
    /// <summary>
    /// 訪問令牌
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 令牌類型
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// 過期時間
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 刷新令牌（可選）
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// 後台用戶信息
    /// </summary>
    public AdminUserInfo? User { get; set; }

    /// <summary>
    /// 是否需要修改密碼
    /// </summary>
    public bool RequirePasswordChange { get; set; }

    /// <summary>
    /// 需要修改密碼的原因
    /// </summary>
    public string? PasswordChangeReason { get; set; }
}

/// <summary>
/// 系統初始化狀態響應
/// </summary>
public class SystemInitResponse
{
    /// <summary>
    /// 是否需要初始化（沒有管理員時返回 true）
    /// </summary>
    public bool Init { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// 更新頭像請求
/// </summary>
public class UpdateAvatarRequest
{
    /// <summary>
    /// 檔案 ID（設為 null 可移除頭像）
    /// </summary>
    public Guid? FileId { get; set; }
}

/// <summary>
/// 更新個人資料請求
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// 顯示名稱
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 電子郵件
    /// </summary>
    public string? Email { get; set; }
}