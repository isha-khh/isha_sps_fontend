using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 系統操作日誌
/// </summary>
public class ActionLog : BaseEntity<long>
{
    /// <summary>
    /// 動作類型 (Create, Update, Delete, Login, Logout 等)
    /// </summary>
    public string? ActionType { get; set; }

    /// <summary>
    /// 動作名稱（中文描述）
    /// </summary>
    public string? ActionName { get; set; }

    /// <summary>
    /// 使用者類型（Admin, Member）
    /// </summary>
    public string? UserType { get; set; }

    /// <summary>
    /// 使用者類型名稱
    /// </summary>
    public string? UserTypeName { get; set; }

    /// <summary>
    /// 使用者資料類型
    /// </summary>
    public string? UserDataType { get; set; }

    /// <summary>
    /// 使用者資料類型名稱
    /// </summary>
    public string? UserDataTypeName { get; set; }

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
    /// 實體類型名稱
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

    /// <summary>
    /// 原始 XML 資料（舊資料保留）
    /// </summary>
    public string? Xml { get; set; }
}
