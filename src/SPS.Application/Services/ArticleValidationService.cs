using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>實作見 <see cref="IArticleValidationService"/>。</summary>
public class ArticleValidationService : IArticleValidationService
{
    /// <summary>原因欄位的長度上限（字元），避免一篇問題很多的文章寫出超長的文字</summary>
    private const int MaxReasonChars = 1500;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IOptionsMonitor<ContentValidationOptions> _options;
    private readonly ILogger<ArticleValidationService> _logger;

    public ArticleValidationService(
        IUnitOfWork unitOfWork,
        IOptionsMonitor<ContentValidationOptions> options,
        ILogger<ArticleValidationService> logger)
    {
        _unitOfWork = unitOfWork;
        _options = options;
        _logger = logger;
    }

    public IReadOnlyList<ArticleContentIssue> Validate(string? contentJson) => ArticleContentRules.Validate(contentJson);

    public async Task<bool> EnforceAsync(EmbeddingSourceType sourceType, string sourceId, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();

        switch (sourceType)
        {
            case EmbeddingSourceType.News when int.TryParse(sourceId, out var newsId):
            {
                var news = await db.Set<News>().Include(n => n.Content).Include(n => n.Title).FirstOrDefaultAsync(n => n.Id == newsId, ct);
                if (news is not { Published: true }) return false;
                var errors = Errors(news.Content?.DefaultText);
                if (errors.Count == 0) return false;
                return await DraftAsync(db, "公告", newsId, news.Title?.DefaultText, errors, () =>
                {
                    news.Published = false;
                    news.UnpublishReason = BuildReason(errors);
                }, ct);
            }
            case EmbeddingSourceType.Faq when int.TryParse(sourceId, out var questionId):
            {
                var question = await db.Set<Question>().Include(q => q.Answer).Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == questionId, ct);
                if (question is not { Published: true }) return false;
                var errors = Errors(question.Answer?.DefaultText);
                if (errors.Count == 0) return false;
                return await DraftAsync(db, "常見問題", questionId, question.Subject?.DefaultText, errors, () =>
                {
                    question.Published = false;
                    question.UnpublishReason = BuildReason(errors);
                }, ct);
            }
            case EmbeddingSourceType.Case when int.TryParse(sourceId, out var caseId):
            {
                var successCase = await db.Set<SuccessCase>().Include(c => c.Content).Include(c => c.Title).FirstOrDefaultAsync(c => c.Id == caseId, ct);
                if (successCase is not { IsPublished: true }) return false;
                var errors = Errors(successCase.Content?.DefaultText);
                if (errors.Count == 0) return false;
                return await DraftAsync(db, "產業案例", caseId, successCase.Title?.DefaultText, errors, () =>
                {
                    successCase.IsPublished = false;
                    successCase.UnpublishReason = BuildReason(errors);
                }, ct);
            }
            default:
                return false; // 其他來源類型（需求、企業）不是文章，不檢查
        }
    }

    private List<ArticleContentIssue> Errors(string? content) => Validate(content).Where(i => i.IsError).ToList();

    private async Task<bool> DraftAsync(DbContext db, string kind, int id, string? title, List<ArticleContentIssue> errors, Action apply, CancellationToken ct)
    {
        if (!_options.CurrentValue.DraftOnViolation)
        {
            _logger.LogWarning("內容檢查：{Kind} #{Id}「{Title}」有 {Count} 個錯誤，但 DraftOnViolation 關閉，不轉草稿：{Reason}",
                kind, id, title, errors.Count, string.Join("；", errors));
            return false;
        }

        apply();
        await db.SaveChangesAsync(ct);
        _logger.LogWarning("內容檢查：{Kind} #{Id}「{Title}」有 {Count} 個錯誤，已自動轉為草稿：{Reason}",
            kind, id, title, errors.Count, string.Join("；", errors));
        return true;
    }

    private static string BuildReason(List<ArticleContentIssue> errors)
    {
        // 固定用台北時間（UTC+8，沒有日光節約）顯示，後台使用者看得懂
        var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(8));
        var reason = $"內容檢查（{now:yyyy-MM-dd HH:mm}）發現 {errors.Count} 個問題，已自動轉為草稿：{string.Join("；", errors)}。請修正後重新發布。";
        return reason.Length > MaxReasonChars ? reason[..(MaxReasonChars - 1)] + "…" : reason;
    }
}
