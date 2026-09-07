namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 操作日誌服務介面
/// </summary>
public interface IActionLogService
{
    /// <summary>
    /// 記錄操作日誌
    /// </summary>
    Task LogAsync(ActionLogEntry entry, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄登入
    /// </summary>
    /// <param name="userId">使用者 ID</param>
    /// <param name="userName">使用者名稱</param>
    /// <param name="userType">使用者類型</param>
    /// <param name="isSuccess">是否成功</param>
    /// <param name="loginMethod">登入方式：密碼、Fido2</param>
    /// <param name="ipAddress">IP 位址</param>
    /// <param name="userAgent">User Agent</param>
    /// <param name="errorMessage">錯誤訊息</param>
    /// <param name="cancellationToken">取消權杖</param>
    Task LogLoginAsync(string userId, string userName, string userType, bool isSuccess, string? loginMethod = "密碼", string? ipAddress = null, string? userAgent = null, string? errorMessage = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄登出
    /// </summary>
    Task LogLogoutAsync(string userId, string userName, string userType, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄資料建立
    /// </summary>
    Task LogCreateAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄資料更新
    /// </summary>
    Task LogUpdateAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄資料刪除
    /// </summary>
    Task LogDeleteAsync(string userId, string userName, string userType, string entityType, string entityId, string? entityName = null, string? description = null, string? ipAddress = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄 API 請求
    /// </summary>
    Task LogApiRequestAsync(ActionLogEntry entry, CancellationToken cancellationToken = default);
}

/// <summary>
/// 操作日誌項目
/// </summary>
public class ActionLogEntry
{
    /// <summary>
    /// 動作類型 (Login, Logout, Create, Update, Delete, View, Export, Import, ApiRequest 等)
    /// </summary>
    public string ActionType { get; set; } = string.Empty;

    /// <summary>
    /// 動作名稱（中文描述）
    /// </summary>
    public string? ActionName { get; set; }

    /// <summary>
    /// 使用者類型 (Admin, Member)
    /// </summary>
    public string? UserType { get; set; }

    /// <summary>
    /// 使用者 ID
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// 使用者名稱
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// 實體類型
    /// </summary>
    public string? EntityType { get; set; }

    /// <summary>
    /// 實體類型名稱（中文）
    /// </summary>
    public string? EntityTypeName { get; set; }

    /// <summary>
    /// 實體 ID
    /// </summary>
    public string? EntityId { get; set; }

    /// <summary>
    /// 實體名稱
    /// </summary>
    public string? EntityName { get; set; }

    /// <summary>
    /// 描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// IP 位址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User Agent
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 是否成功
    /// </summary>
    public bool IsSuccess { get; set; } = true;

    /// <summary>
    /// 錯誤訊息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 執行時間（毫秒）
    /// </summary>
    public long? ExecutionDuration { get; set; }
}
