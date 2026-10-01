using SPS.Application.Common;
using SPS.Application.DTOs.Scoring;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 委員評分服務接口（新興會員審查用）
/// </summary>
public interface IScoringService
{
    /// <summary>
    /// 新增一筆專家評分（由內部帳號代為輸入）
    /// </summary>
    Task<Result<bool>> AddExpertScoreAsync(
        Guid applicationId,
        AddExpertScoreRequest request,
        Guid enteredByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得一張申請的委員評分彙總結果
    /// </summary>
    Task<Result<ScoringSummaryResponse>> GetScoringSummaryAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);
}
