using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 密碼歷史紀錄：每次設定密碼（註冊、改密碼、重設、管理員代設）存一筆「雜湊後」的密碼，
/// 供「密碼策略 → 不可重複使用前 N 組密碼」比對用。只存雜湊，不存明碼。
/// 前台會員與後台使用者各用自己的欄位（兩個擇一），刪除帳號時一併刪除。
/// </summary>
public class PasswordHistory : BaseEntity<Guid>
{
    /// <summary>前台會員（後台使用者的紀錄為 null）</summary>
    public Guid? MemberId { get; set; }

    /// <summary>後台使用者（前台會員的紀錄為 null）</summary>
    public Guid? UserId { get; set; }

    /// <summary>密碼雜湊（與 Member.Password／User.Password 同一種格式）</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public Member? Member { get; set; }
    public User? User { get; set; }
}
