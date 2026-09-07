namespace SPS.Application.DTOs.Demand;

public class DemandResponse
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public bool Published { get; set; }
    public DateTime CreatedTime { get; set; }

    /// <summary>已綁定的標籤分類 ID（CategoryType.CompanyTag）</summary>
    public List<int> TagIds { get; set; } = new();

    /// <summary>已綁定的標籤名稱（與 TagIds 對應）</summary>
    public List<string> TagNames { get; set; } = new();
}

/// <summary>需求標籤綁定結果（GET/PUT /api/Demand/{id}/tags）</summary>
public class DemandTagsResponse
{
    public int DemandId { get; set; }
    public List<int> TagIds { get; set; } = new();
    public List<string> TagNames { get; set; } = new();
}

/// <summary>設定需求標籤請求（覆寫綁定；傳入空集合代表清除）</summary>
public class SetDemandTagsRequest
{
    public List<int> TagIds { get; set; } = new();
}

public class CreateDemandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public Guid? CompanyId { get; set; }
    public bool Published { get; set; }
}

public class UpdateDemandRequest
{
    public string? Name { get; set; }
    public string? Introduction { get; set; }
    public bool? Published { get; set; }

    /// <summary>
    /// 發布時要寄送媒合通知的供給端業者 Id 清單。
    /// 若為 null，則沿用預設規則（標籤重疊度 ≥30% 的業者全部寄送）。
    /// </summary>
    public List<Guid>? NotifyCompanyIds { get; set; }
}

public class DemandQueryParameters
{
    public string? Search { get; set; }
    public Guid? CompanyId { get; set; }
    public bool? Published { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
