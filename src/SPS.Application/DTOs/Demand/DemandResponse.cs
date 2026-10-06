namespace SPS.Application.DTOs.Demand;

public class DemandResponse
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>完整內容；匿名與非企業會員呼叫時為 null（<see cref="ContentLocked"/> = true）</summary>
    public string? Introduction { get; set; }
    public string? Location { get; set; }

    /// <summary>公開摘要（後台輸入）；沒填時前台用 <see cref="Summary"/></summary>
    public string? PublicSummary { get; set; }

    /// <summary>給所有訪客看的摘要：有填公開摘要就用，沒填就取完整內容開頭</summary>
    public string? Summary { get; set; }

    /// <summary>true = 呼叫者沒有權限看完整內容與附件（要登入企業會員）</summary>
    public bool ContentLocked { get; set; }

    /// <summary>附件的檔案 Id（只有後台使用者會拿到，編輯表單用）</summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();

    /// <summary>附件下載資訊（只在詳情回傳，且只有企業會員與後台看得到）</summary>
    public List<DemandAttachmentDto> Attachments { get; set; } = new();
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public bool Published { get; set; }

    /// <summary>true = 會員從前台「我要刊登」送出的（未發布時就是待後台審核）</summary>
    public bool MemberSubmitted { get; set; }
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

public class DemandAttachmentDto
{
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FormattedFileSize { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class CreateDemandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public string? Location { get; set; }
    public string? PublicSummary { get; set; }
    public List<Guid>? AttachmentFileIds { get; set; }
    public Guid? CompanyId { get; set; }
    public bool Published { get; set; }
}

/// <summary>會員從前台「我要刊登」送出的需求。送出後是未發布狀態，後台審核（可修改內容）後才上架</summary>
public class SubmitDemandRequest
{
    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.MaxLength(5000)]
    public string? Introduction { get; set; }

    /// <summary>應用情境／應用範疇／智慧技術的企業標籤 Id</summary>
    public List<int> TagIds { get; set; } = new();

    /// <summary>已閱讀並同意免責聲明</summary>
    public bool Agreed { get; set; }
}

public class UpdateDemandRequest
{
    public string? Name { get; set; }
    public string? Introduction { get; set; }

    /// <summary>沒帶（null）= 不更新；空字串 = 清除</summary>
    public string? Location { get; set; }
    public string? PublicSummary { get; set; }

    /// <summary>沒帶（null）= 不更新；空陣列 = 清除全部附件</summary>
    public List<Guid>? AttachmentFileIds { get; set; }
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

    /// <summary>標籤篩選（共用企業標籤分類 ID）：符合任一勾選標籤的需求</summary>
    public List<int>? TagIds { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
