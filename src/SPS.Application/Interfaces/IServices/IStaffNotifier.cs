namespace SPS.Application.Interfaces.IServices;

/// <summary>承辦人員通知：前台有新的詢問單或會員刊登的需求時，寄信給後台設定的收件信箱</summary>
public interface IStaffNotifier
{
    /// <summary>
    /// 排入背景寄送，立刻回傳，**不會因為寄信失敗或太慢影響前台送出**；沒啟用、沒有收件人或超過每小時上限就直接略過。
    /// <paramref name="detailRows"/> 是（標籤，內容）的條列，內容會做 HTML 編碼。
    /// </summary>
    void Notify(string subject, string headline, IEnumerable<(string Label, string? Value)> detailRows, string adminPath);

    /// <summary>寄測試信給目前設定的收件人（後台「寄測試信」按鈕用），回傳實際寄出的收件人數；沒啟用或沒設定回傳 0</summary>
    Task<int> SendTestAsync(CancellationToken ct = default);
}
