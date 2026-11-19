using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>實作見 <see cref="IArticleValidationService"/>。</summary>
public class ArticleValidationService : IArticleValidationService
{
    /// <summary>原因欄位的長度上限（字元），避免一篇問題很多的文章寫出超長的文字</summary>
    private const int MaxReasonChars = 1500;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ArticleValidationService> _logger;

    public ArticleValidationService(IUnitOfWork unitOfWork, ILogger<ArticleValidationService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public IReadOnlyList<ArticleContentIssue> Validate(string? contentJson) => ArticleContentRules.Validate(contentJson);

    public async Task<List<ArticleRef>> ListPublishedAsync(CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();
        var refs = new List<ArticleRef>();
        refs.AddRange((await db.Set<News>().AsNoTracking().Where(n => n.Published).OrderBy(n => n.Id).Select(n => n.Id).ToListAsync(ct)).Select(id => new ArticleRef(ArticleKind.News, id)));
        refs.AddRange((await db.Set<Question>().AsNoTracking().Where(q => q.Published).OrderBy(q => q.Id).Select(q => q.Id).ToListAsync(ct)).Select(id => new ArticleRef(ArticleKind.Faq, id)));
        refs.AddRange((await db.Set<SuccessCase>().AsNoTracking().Where(c => c.IsPublished).OrderBy(c => c.Id).Select(c => c.Id).ToListAsync(ct)).Select(id => new ArticleRef(ArticleKind.Case, id)));
        refs.AddRange((await db.Set<Regulations>().AsNoTracking().Where(r => r.Published).OrderBy(r => r.Id).Select(r => r.Id).ToListAsync(ct)).Select(id => new ArticleRef(ArticleKind.Regulation, id)));
        return refs;
    }

    public async Task<ArticleCheckResult> CheckAsync(ArticleKind kind, int id, bool applyDraft, CancellationToken ct = default)
    {
        var db = _unitOfWork.GetDbContext();

        string? title;
        string? content;
        Action<string>? draft;

        switch (kind)
        {
            case ArticleKind.News:
            {
                var news = await db.Set<News>().Include(n => n.Content).Include(n => n.Title).FirstOrDefaultAsync(n => n.Id == id, ct);
                if (news is not { Published: true }) return Skipped(kind, id);
                title = news.Title?.DefaultText; content = news.Content?.DefaultText;
                draft = reason => { news.Published = false; news.UnpublishReason = reason; };
                break;
            }
            case ArticleKind.Faq:
            {
                var question = await db.Set<Question>().Include(q => q.Answer).Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == id, ct);
                if (question is not { Published: true }) return Skipped(kind, id);
                title = question.Subject?.DefaultText; content = question.Answer?.DefaultText;
                draft = reason => { question.Published = false; question.UnpublishReason = reason; };
                break;
            }
            case ArticleKind.Case:
            {
                var successCase = await db.Set<SuccessCase>().Include(c => c.Content).Include(c => c.Title).FirstOrDefaultAsync(c => c.Id == id, ct);
                if (successCase is not { IsPublished: true }) return Skipped(kind, id);
                title = successCase.Title?.DefaultText; content = successCase.Content?.DefaultText;
                draft = reason => { successCase.IsPublished = false; successCase.UnpublishReason = reason; };
                break;
            }
            case ArticleKind.Regulation:
            {
                var regulation = await db.Set<Regulations>().FirstOrDefaultAsync(r => r.Id == id, ct);
                if (regulation is not { Published: true }) return Skipped(kind, id);
                title = string.IsNullOrWhiteSpace(regulation.Title) ? regulation.Name : regulation.Title; content = regulation.Content;
                draft = reason => { regulation.Published = false; regulation.UnpublishReason = reason; };
                break;
            }
            default:
                return Skipped(kind, id);
        }

        var errors = Validate(content).Where(i => i.IsError).ToList();
        if (errors.Count == 0) return new ArticleCheckResult(kind, id, title, ArticleCheckOutcome.Ok, errors, null);

        var reason = BuildReason(errors);
        if (!applyDraft)
        {
            _logger.LogInformation("內容檢查（預覽）：{Kind} #{Id}「{Title}」有 {Count} 個錯誤：{Reason}", kind, id, title, errors.Count, string.Join("；", errors));
            return new ArticleCheckResult(kind, id, title, ArticleCheckOutcome.WouldDraft, errors, reason);
        }

        draft!(reason);
        await db.SaveChangesAsync(ct);
        _logger.LogWarning("內容檢查：{Kind} #{Id}「{Title}」有 {Count} 個錯誤，已自動轉為草稿：{Reason}", kind, id, title, errors.Count, string.Join("；", errors));
        return new ArticleCheckResult(kind, id, title, ArticleCheckOutcome.Drafted, errors, reason);
    }

    private static ArticleCheckResult Skipped(ArticleKind kind, int id) =>
        new(kind, id, null, ArticleCheckOutcome.Skipped, Array.Empty<ArticleContentIssue>(), null);

    private static string BuildReason(List<ArticleContentIssue> errors)
    {
        // 固定用台北時間（UTC+8，沒有日光節約）顯示，後台使用者看得懂
        var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(8));
        var reason = $"內容檢查（{now:yyyy-MM-dd HH:mm}）發現 {errors.Count} 個問題，已自動轉為草稿：{string.Join("；", errors)}。請修正後重新發布。";
        return reason.Length > MaxReasonChars ? reason[..(MaxReasonChars - 1)] + "…" : reason;
    }
}
