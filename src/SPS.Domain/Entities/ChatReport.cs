using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 會員對「會員之間對話」的檢舉。平常承辦人員看不到會員之間的對話內容，只有被檢舉的對話才開放給承辦人員審閱
/// （後台透過檢舉單讀取該對話的訊息），處理後可以關閉該對話。
/// </summary>
public class ChatReport : BaseEntity<int>
{
    public long ChatRecordId { get; set; }
    public Guid ReporterMemberId { get; set; }

    /// <summary>被檢舉的會員（對話中的另一方）</summary>
    public Guid ReportedMemberId { get; set; }

    public ChatReportReason Reason { get; set; }

    /// <summary>檢舉說明（選填）</summary>
    public string? Detail { get; set; }

    public ChatReportStatus Status { get; set; } = ChatReportStatus.New;

    /// <summary>承辦人員的處理備註</summary>
    public string? HandlerNote { get; set; }

    public Guid? HandledByUserId { get; set; }
    public DateTime? HandledTime { get; set; }
}
