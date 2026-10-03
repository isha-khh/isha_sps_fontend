namespace SPS.Application.DTOs.Application;

/// <summary>
/// 後台補寄申請通知信
/// </summary>
public class ResendApplicationEmailRequest
{
    /// <summary>
    /// 更正後的收件信箱（選填）。沒填就寄到申請目前的聯絡信箱；有填就先寄到新信箱，
    /// 寄成功後才把申請的聯絡信箱改成這個。已通過的申請不能改（會員帳號已建立，信箱要到會員管理修改）。
    /// </summary>
    public string? NewEmail { get; set; }
}
