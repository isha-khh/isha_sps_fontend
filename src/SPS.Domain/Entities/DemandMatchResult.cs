using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 需求的對接結果（issue #98）：這筆需求成功對接到哪些供給端企業。一筆需求可以對接多家；有任何一筆紀錄，
/// 前台該需求的狀態就是「已成功對接」，全部移除就回到「徵求中」。
/// 前台公開的只有「已成功對接」這個狀態，<b>對接的是哪家只有刊登端（同一家公司的會員）與後台看得到</b>。
/// 企業名錄排序的「成功對接次數」＝某家供給端出現在幾筆需求的對接結果裡（同一筆需求同一家只算一次，由唯一索引保證）。
/// 沒有審核：填了就生效，所以後台要能查看與撤銷（誰填的、什麼時候填的都記錄）。
/// </summary>
public class DemandMatchResult : BaseEntity<int>
{
    public int DemandId { get; set; }
    public Demand Demand { get; set; } = null!;

    /// <summary>對接成功的供給端企業</summary>
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    /// <summary>前台填報的會員；後台承辦人員填報時為空</summary>
    public Guid? ReportedByMemberId { get; set; }

    /// <summary>後台填報的使用者；前台會員填報時為空</summary>
    public Guid? ReportedByUserId { get; set; }
}
