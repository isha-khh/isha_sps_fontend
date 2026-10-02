using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Scoring;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 委員評分服務實現（新興會員審查用）。外部專家沒有後台帳號，評分結果
/// 由內部審核人員代為輸入，一位專家一筆 Scoring 紀錄。
/// </summary>
public class ScoringService : IScoringService
{
    // 6 子分數權重：人力資源20%／團隊學經歷20%／相關經驗20%／財務制度10%／
    // 產品實績20%／財務狀況10%（官方 PDF 附件三）
    private const decimal HumanResourcesWeight = 0.2m;
    private const decimal TeamExperienceWeight = 0.2m;
    private const decimal RelevantExperienceWeight = 0.2m;
    private const decimal FinancialSystemWeight = 0.1m;
    private const decimal ProductTrackRecordWeight = 0.2m;
    private const decimal FinancialStatusWeight = 0.1m;

    private const decimal QualifyingThreshold = 70m;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ScoringService> _logger;

    public ScoringService(IUnitOfWork unitOfWork, ILogger<ScoringService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> AddExpertScoreAsync(
        Guid applicationId,
        AddExpertScoreRequest request,
        Guid enteredByUserId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<bool>.Failure("申請不存在");
            }

            var guardError = ValidateScoringAllowed(application);
            if (guardError != null)
            {
                return Result<bool>.Failure(guardError);
            }

            var scoring = new Scoring
            {
                ApplicationId = applicationId,
                ExpertName = request.ExpertName,
                EnteredByUserId = enteredByUserId,
                HumanResourcesScore = request.HumanResourcesScore,
                TeamExperienceScore = request.TeamExperienceScore,
                RelevantExperienceScore = request.RelevantExperienceScore,
                FinancialSystemScore = request.FinancialSystemScore,
                ProductTrackRecordScore = request.ProductTrackRecordScore,
                FinancialStatusScore = request.FinancialStatusScore,
                CreatedTime = DateTime.UtcNow
            };

            var db = _unitOfWork.GetDbContext();
            await db.Set<Scoring>().AddAsync(scoring, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Added expert score by {ExpertName} for application {ApplicationId}, entered by user {UserId}",
                request.ExpertName, applicationId, enteredByUserId);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding expert score for application {ApplicationId}", applicationId);
            return Result<bool>.Failure($"新增評分失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteExpertScoreAsync(
        Guid applicationId,
        long scoringId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<bool>.Failure("申請不存在");
            }

            var guardError = ValidateScoringAllowed(application);
            if (guardError != null)
            {
                return Result<bool>.Failure(guardError);
            }

            var db = _unitOfWork.GetDbContext();
            var scoring = await db.Set<Scoring>()
                .FirstOrDefaultAsync(s => s.Id == scoringId && s.ApplicationId == applicationId, cancellationToken);
            if (scoring == null)
            {
                return Result<bool>.Failure("找不到這筆評分紀錄");
            }

            db.Set<Scoring>().Remove(scoring);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted expert score {ScoringId} of application {ApplicationId}", scoringId, applicationId);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expert score {ScoringId}", scoringId);
            return Result<bool>.Failure($"刪除評分失敗: {ex.Message}");
        }
    }

    /// <summary>
    /// 委員評分只適用新興會員（SupplierTier == Emerging）的申請，而且只能在
    /// 核准/退回之前新增或刪除——決議後評分紀錄是審查依據，不能再動。
    /// </summary>
    private static string? ValidateScoringAllowed(MemberApplication application)
    {
        if (application.SupplierTier != CompanyLevel.Emerging)
        {
            return "只有新興會員的申請需要委員評分";
        }

        if (application.Status != ApplicationStatus.PendingReview && application.Status != ApplicationStatus.UnderReview)
        {
            return "申請已有審核結果或尚未送出，無法再異動評分";
        }

        return null;
    }

    public async Task<Result<ScoringSummaryResponse>> GetScoringSummaryAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _unitOfWork.GetDbContext();
            var scorings = await db.Set<Scoring>()
                .Where(s => s.ApplicationId == applicationId)
                .OrderBy(s => s.CreatedTime)
                .ToListAsync(cancellationToken);

            var experts = scorings.Select(s =>
            {
                var total = (s.HumanResourcesScore ?? 0) * HumanResourcesWeight
                    + (s.TeamExperienceScore ?? 0) * TeamExperienceWeight
                    + (s.RelevantExperienceScore ?? 0) * RelevantExperienceWeight
                    + (s.FinancialSystemScore ?? 0) * FinancialSystemWeight
                    + (s.ProductTrackRecordScore ?? 0) * ProductTrackRecordWeight
                    + (s.FinancialStatusScore ?? 0) * FinancialStatusWeight;

                return new ExpertScoreResult
                {
                    ScoringId = s.Id,
                    ExpertName = s.ExpertName ?? string.Empty,
                    TotalScore = total,
                    IsQualified = total >= QualifyingThreshold
                };
            }).ToList();

            var qualifiedCount = experts.Count(e => e.IsQualified);
            var totalCount = experts.Count;

            // 委員半數（含）給予 70 分（含）以上者為合格
            var isPassed = totalCount > 0 && qualifiedCount * 2 >= totalCount;

            var response = new ScoringSummaryResponse
            {
                Experts = experts,
                QualifiedCount = qualifiedCount,
                TotalCount = totalCount,
                IsPassed = isPassed
            };

            return Result<ScoringSummaryResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting scoring summary for application {ApplicationId}", applicationId);
            return Result<ScoringSummaryResponse>.Failure($"取得評分彙總失敗: {ex.Message}");
        }
    }
}
