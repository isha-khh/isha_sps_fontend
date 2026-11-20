namespace SPS.Application.DTOs.Demand;

/// <summary>需求對接到的供給端企業（只有刊登端與後台看得到，前台公開頁只有「已成功對接」狀態）</summary>
public class MatchedCompanyDto
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;

    /// <summary>企業編號</summary>
    public string? Number { get; set; }

    /// <summary>填報時間</summary>
    public DateTime ReportedTime { get; set; }

    /// <summary>誰填的：前台會員的 email 或「後台」；後台查看、撤銷時判斷用</summary>
    public string? ReportedBy { get; set; }
}

/// <summary>設定需求的對接結果：整組覆寫，傳空陣列＝移除全部（狀態回到「徵求中」）</summary>
public class SetDemandMatchesRequest
{
    public List<Guid> CompanyIds { get; set; } = new();
}

public class DemandMatchesResponse
{
    public int DemandId { get; set; }

    /// <summary>有任何一家＝已成功對接</summary>
    public bool Matched { get; set; }
    public List<MatchedCompanyDto> Companies { get; set; } = new();
}

/// <summary>對接結果選企業用的選項（已審核通過、啟用的供給端與供需雙方企業）</summary>
public class MatchCompanyOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Number { get; set; }
}
