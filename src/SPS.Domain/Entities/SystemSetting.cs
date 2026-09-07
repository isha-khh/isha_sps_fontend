using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 系統設定 (使用 JSONB 儲存分類設定)
/// </summary>
public class SystemSetting : BaseEntity<int>
{
    /// <summary>
    /// 設定分類 (Key) - 例如: "Email", "GoogleAnalytics", "Jwt"
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 設定值 (JSONB)
    /// </summary>
    // 在 EF Core 設定中會映射為 jsonb 類型
    public string Value { get; set; } = "{}";

    /// <summary>
    /// 設定描述
    /// </summary>
    public string? Description { get; set; }
}
