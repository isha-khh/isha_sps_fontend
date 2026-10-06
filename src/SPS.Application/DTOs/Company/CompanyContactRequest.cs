namespace SPS.Application.DTOs.Company;

/// <summary>企業名錄「取得聯繫窗口」請求：使用者勾選想了解的智慧技術範疇（供平台了解需求，不影響回傳內容）</summary>
public class CompanyContactRequest
{
    /// <summary>勾選的範疇（最多 20 項、每項最長 50 字，超過的忽略）</summary>
    public List<string>? Scopes { get; set; }
}

/// <summary>聯繫窗口資訊</summary>
public class CompanyContactResponse
{
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
}
