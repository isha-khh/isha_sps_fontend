using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 會員收件匣的站內通知：系統事件（回應審核結果、收到的回應、新需求媒合、詢問單回覆）發生時寫入，
/// 會員在前台頁首與會員中心「收件匣」查看。與寄信並行，不取代寄信。只有擁有者看得到自己的通知。
/// </summary>
public class MemberNotification : BaseEntity<long>
{
    public Guid MemberId { get; set; }
    public MemberNotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>內文（純文字，可多行）</summary>
    public string? Content { get; set; }

    /// <summary>點「查看」要前往的前台站內路徑（以 / 開頭，不含網站根路徑），沒有就不顯示連結</summary>
    public string? LinkPath { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
