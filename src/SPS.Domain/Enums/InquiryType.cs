namespace SPS.Domain.Enums;

/// <summary>詢問單種類：前台各個「留下資料等人回覆」的表單共用同一張表，用這個欄位區分來源</summary>
public enum InquiryType : short
{
    /// <summary>媒合需求詳情「我要提案」（企業會員）</summary>
    ProposeSolution = 1,

    /// <summary>媒合對接「訂閱解方」（登入會員）</summary>
    SubscribeSolution = 2,

    /// <summary>服務專區詳情「立即下載」申請</summary>
    DownloadRequest = 3,

    /// <summary>政府補助資源「索取資料協助評估」</summary>
    SupportRequest = 4,

    /// <summary>頁尾「訂閱電子報」</summary>
    Newsletter = 5,
}
