using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 查詢申請進度請求：申請編號＋申請時填的信箱，兩者都對得上才回結果
/// </summary>
public class ApplicationStatusRequest
{
    [Required(ErrorMessage = "請輸入申請編號")]
    [MaxLength(40)]
    public string ApplicationNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "請輸入申請時填寫的電子信箱")]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// 申請進度。刻意只放申請人已經會在郵件裡收到的資訊（狀態、時間、未通過原因），
/// 不含聯絡資料、附件、審核員內部備註或評分
/// </summary>
public class ApplicationStatusResponse
{
    public string ApplicationNumber { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; }

    /// <summary>
    /// 狀態中文說明（給畫面直接顯示）
    /// </summary>
    public string StatusText { get; set; } = string.Empty;

    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    /// <summary>
    /// 未通過原因（只有狀態為已拒絕時才有值）
    /// </summary>
    public string? RejectionReason { get; set; }

    /// <summary>
    /// 已通過：可以直接用註冊時的信箱與密碼登入
    /// </summary>
    public bool CanLogin { get; set; }
}
