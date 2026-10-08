using System.ComponentModel.DataAnnotations;
using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Demand;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 需求回應：供應業者對媒合對接的需求提出回應，後台審核通過後才寄給刊登者與追蹤者（追蹤 = 需求端會員的 MemberDemand）。
/// 同一家供應業者對同一需求可以回應多次，不設上限。信件在背景用新的 DI scope 寄送，寄信失敗只記 log，不影響審核結果。
/// </summary>
public class DemandReplyService : IDemandReplyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffNotifier _notifier;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DemandReplyService> _logger;

    public DemandReplyService(IUnitOfWork unitOfWork, IStaffNotifier notifier, IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<DemandReplyService> logger)
    {
        _unitOfWork = unitOfWork;
        _notifier = notifier;
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    private DbContext Db => _unitOfWork.GetDbContext();

    public async Task<Result<bool>> CreateAsync(Guid memberId, int demandId, CreateDemandReplyRequest request, CancellationToken ct = default)
    {
        if (!request.Acknowledged) return Result<bool>.Failure("請先勾選「我了解回應的收件對象」");
        var name = request.ContactName?.Trim();
        var email = request.ContactEmail?.Trim();
        var content = request.Content?.Trim();
        if (string.IsNullOrEmpty(name)) return Result<bool>.Failure("請輸入聯絡人姓名");
        if (string.IsNullOrEmpty(email) || !new EmailAddressAttribute().IsValid(email)) return Result<bool>.Failure("請輸入有效的聯絡信箱");
        if (string.IsNullOrEmpty(content)) return Result<bool>.Failure("請輸入回應內容");
        if (content.Length > 3000) return Result<bool>.Failure("回應內容最多 3000 字");

        var member = await _unitOfWork.Members.GetByIdAsync(memberId, ct);
        if (member == null || member.Status != Status.Active) return Result<bool>.Failure("找不到會員資料");
        if (member.Role != MemberRole.Supplier || !member.IsApproved) return Result<bool>.Failure("僅供應端企業會員可以回應需求");

        var demand = await _unitOfWork.Demands.GetByIdAsync(demandId, ct);
        if (demand == null || demand.Status != Status.Active) return Result<bool>.Failure("需求不存在或已下架");

        var reply = new DemandReply
        {
            DemandId = demandId,
            MemberId = memberId,
            CompanyName = member.CompanyName,
            ContactName = name,
            ContactEmail = email,
            ContactPhone = string.IsNullOrWhiteSpace(request.ContactPhone) ? null : request.ContactPhone.Trim(),
            Content = content,
            Status = DemandReplyStatus.Pending,
        };
        Db.Set<DemandReply>().Add(reply);
        await _unitOfWork.SaveChangesAsync(ct);

        _notifier.Notify(
            "【SPS】供應業者回應了需求，待審核",
            "有供應業者回應了媒合對接的需求，審核通過後才會寄給刊登者與追蹤者",
            new (string, string?)[]
            {
                ("需求編號", demand.Number),
                ("需求標題", demand.Name),
                ("公司", reply.CompanyName),
                ("聯絡人", reply.ContactName),
                ("信箱", reply.ContactEmail),
                ("電話", reply.ContactPhone),
                ("回應內容", content.Length > 300 ? content[..300] + "…" : content),
            },
            "/demand-replies");

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<MyDemandReplyResponse>>> GetMineAsync(Guid memberId, CancellationToken ct = default)
    {
        var rows = await Db.Set<DemandReply>().AsNoTracking()
            .Where(r => r.MemberId == memberId)
            .OrderByDescending(r => r.CreatedTime)
            .Take(200)
            .Select(r => new MyDemandReplyResponse
            {
                Id = r.Id,
                DemandId = r.DemandId,
                DemandNumber = r.Demand.Number,
                DemandName = r.Demand.Name,
                Content = r.Content,
                Status = r.Status.ToString(),
                RejectReason = r.RejectReason,
                CreatedTime = r.CreatedTime,
                ReviewedAt = r.ReviewedAt,
            })
            .ToListAsync(ct);
        return Result<List<MyDemandReplyResponse>>.Success(rows);
    }

    public async Task<Result<PagedResult<DemandReplyAdminResponse>>> GetPagedAsync(DemandReplyQueryParameters parameters, CancellationToken ct = default)
    {
        var query = Db.Set<DemandReply>().AsNoTracking().AsQueryable();
        if (Enum.TryParse<DemandReplyStatus>(parameters.Status, true, out var status)) query = query.Where(r => r.Status == status);
        if (parameters.DemandId.HasValue) query = query.Where(r => r.DemandId == parameters.DemandId.Value);

        var page = Math.Max(1, parameters.Page);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);
        var total = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(r => r.CreatedTime)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new { Reply = r, r.Demand.Number, r.Demand.Name })
            .ToListAsync(ct);

        var items = new List<DemandReplyAdminResponse>();
        var followerCounts = new Dictionary<int, int>();
        foreach (var row in rows)
        {
            if (!followerCounts.TryGetValue(row.Reply.DemandId, out var count))
            {
                count = await CountFollowersAsync(row.Reply.DemandId, ct);
                followerCounts[row.Reply.DemandId] = count;
            }
            items.Add(ToAdmin(row.Reply, row.Number, row.Name, count));
        }

        return Result<PagedResult<DemandReplyAdminResponse>>.Success(new PagedResult<DemandReplyAdminResponse>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    public async Task<Result<DemandReplyCountsResponse>> GetCountsAsync(CancellationToken ct = default)
    {
        var groups = await Db.Set<DemandReply>().AsNoTracking().GroupBy(r => r.Status).Select(g => new { g.Key, Count = g.Count() }).ToListAsync(ct);
        int Of(DemandReplyStatus s) => groups.FirstOrDefault(g => g.Key == s)?.Count ?? 0;
        return Result<DemandReplyCountsResponse>.Success(new DemandReplyCountsResponse
        {
            Pending = Of(DemandReplyStatus.Pending),
            Approved = Of(DemandReplyStatus.Approved),
            Rejected = Of(DemandReplyStatus.Rejected),
        });
    }

    public async Task<Result<DemandReplyAdminResponse>> ApproveAsync(int id, Guid? reviewedByUserId, CancellationToken ct = default)
    {
        var reply = await Db.Set<DemandReply>().Include(r => r.Demand).FirstOrDefaultAsync(r => r.Id == id, ct);
        if (reply == null) return Result<DemandReplyAdminResponse>.Failure("回應不存在");
        if (reply.Status != DemandReplyStatus.Pending) return Result<DemandReplyAdminResponse>.Failure("這則回應已經審核過了");
        if (reply.Demand.Status != Status.Active) return Result<DemandReplyAdminResponse>.Failure("對應的需求已下架，無法通過；請退回或先重新上架需求");

        reply.Status = DemandReplyStatus.Approved;
        reply.ReviewedByUserId = reviewedByUserId;
        reply.ReviewedAt = DateTime.UtcNow;
        reply.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(ct);

        var replyId = reply.Id;
        _ = Task.Run(() => SendApprovedMailsAsync(replyId));

        var followers = await CountFollowersAsync(reply.DemandId, ct);
        return Result<DemandReplyAdminResponse>.Success(ToAdmin(reply, reply.Demand.Number, reply.Demand.Name, followers));
    }

    public async Task<Result<DemandReplyAdminResponse>> RejectAsync(int id, string reason, Guid? reviewedByUserId, CancellationToken ct = default)
    {
        reason = reason?.Trim() ?? string.Empty;
        if (reason.Length == 0) return Result<DemandReplyAdminResponse>.Failure("請填寫退回原因");
        if (reason.Length > 500) return Result<DemandReplyAdminResponse>.Failure("退回原因最多 500 字");

        var reply = await Db.Set<DemandReply>().Include(r => r.Demand).FirstOrDefaultAsync(r => r.Id == id, ct);
        if (reply == null) return Result<DemandReplyAdminResponse>.Failure("回應不存在");
        if (reply.Status != DemandReplyStatus.Pending) return Result<DemandReplyAdminResponse>.Failure("這則回應已經審核過了");

        reply.Status = DemandReplyStatus.Rejected;
        reply.RejectReason = reason;
        reply.ReviewedByUserId = reviewedByUserId;
        reply.ReviewedAt = DateTime.UtcNow;
        reply.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(ct);

        var replyId = reply.Id;
        _ = Task.Run(() => SendRejectedMailAsync(replyId));

        return Result<DemandReplyAdminResponse>.Success(ToAdmin(reply, reply.Demand.Number, reply.Demand.Name, 0));
    }

    public Task<int> CountFollowersAsync(int demandId, CancellationToken ct = default) => CountFollowersAsync(Db, demandId, ct);

    private static async Task<int> CountFollowersAsync(DbContext db, int demandId, CancellationToken ct)
    {
        var emails = await FollowerEmailsAsync(db, demandId, ct);
        return emails.Count;
    }

    /// <summary>追蹤者 = 追蹤這筆需求、仍有效的需求端企業會員（供應端以前收藏過的不算）</summary>
    private static async Task<List<string>> FollowerEmailsAsync(DbContext db, int demandId, CancellationToken ct)
    {
        var emails = await db.Set<MemberDemand>()
            .Where(md => md.DemandId == demandId
                         && md.Member.Role == MemberRole.Buyer
                         && md.Member.Status == Status.Active
                         && md.Member.IsApproved
                         && md.Member.Email != string.Empty)
            .Select(md => md.Member.Email)
            .ToListAsync(ct);
        return emails.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static DemandReplyAdminResponse ToAdmin(DemandReply r, string demandNumber, string demandName, int followerCount) => new()
    {
        Id = r.Id,
        DemandId = r.DemandId,
        DemandNumber = demandNumber,
        DemandName = demandName,
        MemberId = r.MemberId,
        CompanyName = r.CompanyName,
        ContactName = r.ContactName,
        ContactEmail = r.ContactEmail,
        ContactPhone = r.ContactPhone,
        Content = r.Content,
        Status = r.Status.ToString(),
        RejectReason = r.RejectReason,
        CreatedTime = r.CreatedTime,
        ReviewedAt = r.ReviewedAt,
        SentCount = r.SentCount,
        FollowerCount = followerCount,
    };

    // ===== 寄信（背景，新的 DI scope） =====

    private async Task SendApprovedMailsAsync(int replyId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IUnitOfWork>().GetDbContext();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var reply = await db.Set<DemandReply>().Include(r => r.Demand).FirstOrDefaultAsync(r => r.Id == replyId);
            if (reply == null) return;
            if (!await email.IsEnabledAsync()) return;

            // 收件人：刊登者（會員刊登的需求才有）加上當下所有追蹤者，同一信箱只寄一封
            var recipients = new List<string>();
            if (reply.Demand.SubmittedByMemberId is { } publisherId)
            {
                var publisherEmail = await db.Set<Member>().Where(m => m.Id == publisherId && m.Status == Status.Active).Select(m => m.Email).FirstOrDefaultAsync();
                if (!string.IsNullOrWhiteSpace(publisherEmail)) recipients.Add(publisherEmail);
            }
            recipients.AddRange(await FollowerEmailsAsync(db, reply.DemandId, CancellationToken.None));
            recipients = recipients.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            var subject = $"【SPS】需求「{reply.Demand.Name}」收到新的回應";
            var body = BuildApprovedBody(reply);
            var sent = 0;
            foreach (var to in recipients)
            {
                try
                {
                    await email.SendEmailAsync(new EmailOption { To = to, Subject = subject, Body = body, MailType = "DemandReply" });
                    sent++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "寄送需求回應通知給 {To} 失敗（回應 {ReplyId}）", to, replyId);
                }
            }

            reply.SentCount = sent;
            reply.SentAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "需求回應 {ReplyId} 通過後寄信流程失敗", replyId);
        }
    }

    private async Task SendRejectedMailAsync(int replyId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IUnitOfWork>().GetDbContext();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var reply = await db.Set<DemandReply>().Include(r => r.Demand).FirstOrDefaultAsync(r => r.Id == replyId);
            if (reply == null || !await email.IsEnabledAsync()) return;

            var memberEmail = await db.Set<Member>().Where(m => m.Id == reply.MemberId).Select(m => m.Email).FirstOrDefaultAsync();
            var to = string.IsNullOrWhiteSpace(memberEmail) ? reply.ContactEmail : memberEmail;
            await email.SendEmailAsync(new EmailOption
            {
                To = to,
                Subject = $"【SPS】您對需求「{reply.Demand.Name}」的回應未通過審核",
                Body = Wrap("您的回應未通過審核",
                    new[] { ("需求", $"{reply.Demand.Number} {reply.Demand.Name}"), ("退回原因", reply.RejectReason), ("您的回應", reply.Content) },
                    null, null),
                MailType = "DemandReply",
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "寄送需求回應退回通知失敗（回應 {ReplyId}）", replyId);
        }
    }

    private string BuildApprovedBody(DemandReply reply)
    {
        var baseUrl = (_configuration["App:BaseUrl"] ?? string.Empty).TrimEnd('/');
        var link = string.IsNullOrEmpty(baseUrl) ? null : $"{baseUrl}/matching/{reply.DemandId}";
        return Wrap("您刊登或追蹤的需求收到新的回應",
            new[]
            {
                ("需求", $"{reply.Demand.Number} {reply.Demand.Name}"),
                ("回應公司", reply.CompanyName),
                ("聯絡人", reply.ContactName),
                ("信箱", reply.ContactEmail),
                ("電話", reply.ContactPhone),
                ("回應內容", reply.Content),
            },
            link, "查看需求");
    }

    private static string Wrap(string headline, IEnumerable<(string Label, string? Value)> rows, string? link, string? linkText)
    {
        static string enc(string value) => WebUtility.HtmlEncode(value);
        var items = string.Concat(rows.Where(r => !string.IsNullOrWhiteSpace(r.Value)).Select(r =>
            $"<tr><td style=\"padding:6px 14px 6px 0;color:#555;white-space:nowrap;vertical-align:top\">{enc(r.Label)}</td><td style=\"padding:6px 0;color:#1a1a1a\">{enc(r.Value!).Replace("\n", "<br>")}</td></tr>"));
        return $"<div style=\"font-family:'Noto Sans TC',Arial,sans-serif;font-size:15px;line-height:1.7\">" +
               $"<p style=\"font-size:17px;font-weight:700;color:#0e3f6b;margin:0 0 12px\">{enc(headline)}</p>" +
               $"<table style=\"border-collapse:collapse\">{items}</table>" +
               (link == null ? string.Empty : $"<p style=\"margin:18px 0 0\"><a href=\"{enc(link)}\" style=\"color:#0052cc\">{enc(linkText ?? "查看")}</a></p>") +
               "<p style=\"margin:18px 0 0;font-size:12px;color:#888\">這是系統自動寄出的通知信，請勿直接回覆。回應內容為供應業者所提供，內容與報價請自行評估。</p></div>";
    }
}
