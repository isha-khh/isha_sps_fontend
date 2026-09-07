namespace SPS.Application.DTOs.Demand;

/// <summary>
/// AI 語意搜尋找到的相似供給端業者。刻意不回傳原始 cosine/CSLS 分數（數值範圍不直觀、
/// 不同情境下不穩定，直接顯示容易誤導），前端依 Rank 位置自行分級（高/中/低），
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §9.3。
/// </summary>
public class SimilarCompanyByVectorResponse
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? ChargeEmail { get; set; }

    /// <summary>
    /// 排名（1-based，由高到低）
    /// </summary>
    public int Rank { get; set; }
}
