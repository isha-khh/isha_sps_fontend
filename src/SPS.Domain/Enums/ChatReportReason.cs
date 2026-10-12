namespace SPS.Domain.Enums;

/// <summary>會員檢舉對話的原因</summary>
public enum ChatReportReason
{
    Harassment = 1,
    Spam = 2,
    Fraud = 3,
    Other = 4
}

/// <summary>檢舉的處理狀態</summary>
public enum ChatReportStatus
{
    New = 0,
    Reviewed = 1
}
