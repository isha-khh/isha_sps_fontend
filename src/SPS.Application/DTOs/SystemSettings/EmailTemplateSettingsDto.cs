namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 信件範本設定
/// </summary>
public class EmailTemplateSettingsDto
{
    /// <summary>
    /// 範本列表
    /// </summary>
    public List<EmailTemplate> Templates { get; set; } = new();
}

/// <summary>
/// 信件範本
/// </summary>
public class EmailTemplate
{
    /// <summary>
    /// 範本識別碼
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// 範本名稱（顯示用）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 郵件主旨
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// HTML 內容
    /// </summary>
    public string HtmlContent { get; set; } = string.Empty;

    /// <summary>
    /// 可用變數列表
    /// </summary>
    public List<string> AvailableVariables { get; set; } = new();

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// 範本預覽請求
/// </summary>
public class EmailTemplatePreviewRequest
{
    /// <summary>
    /// 測試變數
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } = new();
}

/// <summary>
/// 範本測試郵件請求
/// </summary>
public class EmailTemplateTestRequest
{
    /// <summary>
    /// 收件人郵件地址
    /// </summary>
    public string ToEmail { get; set; } = string.Empty;

    /// <summary>
    /// 測試變數
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } = new();
}

/// <summary>
/// 範本預覽回應
/// </summary>
public class EmailTemplatePreviewResponse
{
    /// <summary>
    /// 預覽的主旨
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 預覽的 HTML 內容
    /// </summary>
    public string HtmlContent { get; set; } = string.Empty;
}
