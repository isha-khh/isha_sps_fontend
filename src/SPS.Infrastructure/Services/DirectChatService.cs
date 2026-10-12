using Microsoft.EntityFrameworkCore;
using SPS.Application.Common;
using SPS.Application.DTOs.Chat;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>規則說明見 <see cref="IDirectChatService"/>。</summary>
public class DirectChatService : IDirectChatService
{
    private const int MaxChatsOpenedPerDay = 20;
    private const int MaxReportsPerDay = 5;

    private readonly ApplicationDbContext _db;
    private readonly IMemberChatService _chat;
    private readonly IMemberNotificationService _inbox;
    private readonly IStaffNotifier _staff;

    public DirectChatService(ApplicationDbContext db, IMemberChatService chat, IMemberNotificationService inbox, IStaffNotifier staff)
    {
        _db = db;
        _chat = chat;
        _inbox = inbox;
        _staff = staff;
    }

    public async Task<Result<long>> OpenForReplyAsync(Guid publisherMemberId, int replyId, CancellationToken ct = default)
    {
        var reply = await _db.DemandReplies.Include(r => r.Demand).FirstOrDefaultAsync(r => r.Id == replyId, ct);
        if (reply == null || reply.Status != DemandReplyStatus.Approved) return Result<long>.Failure("回應不存在或尚未通過審核");
        if (reply.Demand.SubmittedByMemberId != publisherMemberId) return Result<long>.Failure("只有刊登這筆需求的會員可以對回應者開啟對話");

        var supplier = await _db.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == reply.MemberId && m.Status == Status.Active, ct);
        if (supplier == null) return Result<long>.Failure("這位回應者的帳號已無法使用");

        // 已經開過就直接回傳（即使之後被封鎖，也能回到既有對話看紀錄，只是不能再傳訊息）
        var existing = await _db.ChatRecords.AsNoTracking().FirstOrDefaultAsync(c => c.Type == 1 && c.DemandReplyId == replyId, ct);
        if (existing != null) return Result<long>.Success(existing.Id);

        if (await IsBlockedEitherWayAsync(publisherMemberId, reply.MemberId, ct)) return Result<long>.Failure("目前無法對這位回應者開啟對話");

        var since = DateTime.UtcNow.AddDays(-1);
        var openedToday = await _db.ChatRecords.CountAsync(c => c.Type == 1 && c.InitiatorMemberId == publisherMemberId && c.CreatedTime >= since, ct);
        if (openedToday >= MaxChatsOpenedPerDay) return Result<long>.Failure($"24 小時內最多開啟 {MaxChatsOpenedPerDay} 個對話，請稍後再試");

        var record = new ChatRecord
        {
            Type = 1,
            Status = ChatStatus.Active,
            InitiatorMemberId = publisherMemberId,
            TargetMemberId = reply.MemberId,
            DemandId = reply.DemandId,
            DemandReplyId = reply.Id,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow,
        };
        _db.ChatRecords.Add(record);
        await _db.SaveChangesAsync(ct);

        var publisherName = await DisplayNameAsync(publisherMemberId, ct);
        await _inbox.AddAsync(reply.MemberId, MemberNotificationType.ChatOpened,
            $"{publisherName} 想與您討論需求「{reply.Demand.Name}」",
            "對方是這筆需求的刊登者，針對您通過審核的回應開啟了對話。您可以到「訊息 → 客服訊息」回覆；如果不想收到訊息，可以在對話裡封鎖對方或檢舉。",
            $"/member?section=chat&chat={record.Id}", ct);

        return Result<long>.Success(record.Id);
    }

    public async Task<Result<List<ReceivedReplyDto>>> GetReceivedRepliesAsync(Guid publisherMemberId, int demandId, CancellationToken ct = default)
    {
        var demand = await _db.Demands.AsNoTracking().FirstOrDefaultAsync(d => d.Id == demandId && d.SubmittedByMemberId == publisherMemberId, ct);
        if (demand == null) return Result<List<ReceivedReplyDto>>.Failure("需求不存在");

        var replies = await _db.DemandReplies.AsNoTracking()
            .Where(r => r.DemandId == demandId && r.Status == DemandReplyStatus.Approved)
            .OrderByDescending(r => r.ReviewedAt ?? r.CreatedTime)
            .Take(200)
            .ToListAsync(ct);

        var replyIds = replies.Select(r => r.Id).ToList();
        var chats = await _db.ChatRecords.AsNoTracking()
            .Where(c => c.Type == 1 && c.DemandReplyId != null && replyIds.Contains(c.DemandReplyId.Value))
            .Select(c => new { c.Id, ReplyId = c.DemandReplyId!.Value })
            .ToListAsync(ct);
        var chatByReply = chats.GroupBy(c => c.ReplyId).ToDictionary(g => g.Key, g => g.First().Id);

        var result = replies.Select(r => new ReceivedReplyDto
        {
            ReplyId = r.Id,
            DemandId = r.DemandId,
            CompanyName = r.CompanyName,
            ContactName = r.ContactName,
            ContactEmail = r.ContactEmail,
            ContactPhone = r.ContactPhone,
            Content = r.Content,
            ReceivedTime = r.ReviewedAt ?? r.CreatedTime,
            ChatRecordId = chatByReply.TryGetValue(r.Id, out var chatId) ? chatId : null,
        }).ToList();
        return Result<List<ReceivedReplyDto>>.Success(result);
    }

    public async Task<List<ChatRecordDto>> EnrichAsync(Guid memberId, List<ChatRecordDto> chats, CancellationToken ct = default)
    {
        if (chats.Count == 0) return chats;

        var ids = chats.Select(c => c.Id).ToList();
        var meta = await _db.ChatRecords.AsNoTracking()
            .Where(c => ids.Contains(c.Id))
            .Select(c => new { c.Id, c.Type, c.DemandId, c.DemandReplyId })
            .ToDictionaryAsync(c => c.Id, ct);

        // 沒有綁定需求回應的舊會員對話（規則訂定前就存在）不在前台顯示
        var visible = chats.Where(c => c.Type != 1 || (meta.TryGetValue(c.Id, out var m) && m.DemandReplyId != null)).ToList();

        var demandIds = meta.Values.Where(m => m.DemandId.HasValue).Select(m => m.DemandId!.Value).Distinct().ToList();
        var demandNames = demandIds.Count == 0
            ? new Dictionary<int, string>()
            : await _db.Demands.AsNoTracking().Where(d => demandIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name, ct);

        var blocks = await _db.MemberBlocks.AsNoTracking().Where(b => b.BlockerMemberId == memberId || b.BlockedMemberId == memberId).ToListAsync(ct);

        foreach (var chat in visible.Where(c => c.Type == 1))
        {
            if (meta.TryGetValue(chat.Id, out var m) && m.DemandId.HasValue)
            {
                chat.DemandId = m.DemandId;
                chat.DemandName = demandNames.GetValueOrDefault(m.DemandId.Value);
            }

            var peer = chat.InitiatorMemberId == memberId ? chat.TargetMemberId : chat.InitiatorMemberId;
            if (peer == null) continue;
            chat.BlockedByMe = blocks.Any(b => b.BlockerMemberId == memberId && b.BlockedMemberId == peer);
            chat.SendBlocked = chat.BlockedByMe || blocks.Any(b => b.BlockerMemberId == peer && b.BlockedMemberId == memberId);
        }

        return visible;
    }

    public async Task<string?> CheckCanSendAsync(Guid memberId, long chatRecordId, CancellationToken ct = default)
    {
        var chat = await _db.ChatRecords.AsNoTracking().FirstOrDefaultAsync(c => c.Id == chatRecordId, ct);
        if (chat == null) return "對話不存在";
        if (chat.Status == ChatStatus.Closed) return "這個對話已經結束";

        if (chat.Type == 2) return chat.InitiatorMemberId == memberId ? null : "沒有權限";

        if (chat.Type != 1 || chat.DemandReplyId == null) return "會員之間的對話尚未開放";
        var peerId = PeerOf(chat, memberId);
        if (peerId == null) return "沒有權限";

        var peerActive = await _db.Members.AsNoTracking().AnyAsync(m => m.Id == peerId && m.Status == Status.Active, ct);
        if (!peerActive) return "對方的帳號已無法使用";

        if (await _db.MemberBlocks.AsNoTracking().AnyAsync(b => b.BlockerMemberId == memberId && b.BlockedMemberId == peerId, ct))
            return "您已封鎖對方，解除封鎖後才能傳送訊息";
        if (await _db.MemberBlocks.AsNoTracking().AnyAsync(b => b.BlockerMemberId == peerId && b.BlockedMemberId == memberId, ct))
            return "目前無法傳送訊息給對方";

        return null;
    }

    public async Task<Guid?> GetPeerMemberIdAsync(Guid memberId, long chatRecordId, CancellationToken ct = default)
    {
        var chat = await _db.ChatRecords.AsNoTracking().FirstOrDefaultAsync(c => c.Id == chatRecordId && c.Type == 1, ct);
        return chat == null ? null : PeerOf(chat, memberId);
    }

    public async Task<Result<bool>> BlockAsync(Guid memberId, long chatRecordId, CancellationToken ct = default)
    {
        var peerId = await GetPeerMemberIdAsync(memberId, chatRecordId, ct);
        if (peerId == null) return Result<bool>.Failure("對話不存在");
        if (!await _db.MemberBlocks.AnyAsync(b => b.BlockerMemberId == memberId && b.BlockedMemberId == peerId, ct))
        {
            _db.MemberBlocks.Add(new MemberBlock { BlockerMemberId = memberId, BlockedMemberId = peerId.Value });
            await _db.SaveChangesAsync(ct);
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> UnblockAsync(Guid memberId, long chatRecordId, CancellationToken ct = default)
    {
        var peerId = await GetPeerMemberIdAsync(memberId, chatRecordId, ct);
        if (peerId == null) return Result<bool>.Failure("對話不存在");
        await _db.MemberBlocks.Where(b => b.BlockerMemberId == memberId && b.BlockedMemberId == peerId).ExecuteDeleteAsync(ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ReportAsync(Guid memberId, long chatRecordId, ReportChatRequest request, CancellationToken ct = default)
    {
        var chat = await _db.ChatRecords.AsNoTracking().FirstOrDefaultAsync(c => c.Id == chatRecordId && c.Type == 1, ct);
        var peerId = chat == null ? null : PeerOf(chat, memberId);
        if (chat == null || peerId == null) return Result<bool>.Failure("對話不存在");

        // 同一個對話已經有一張沒處理的檢舉就不重複建立
        if (await _db.ChatReports.AnyAsync(r => r.ChatRecordId == chatRecordId && r.ReporterMemberId == memberId && r.Status == ChatReportStatus.New, ct))
            return Result<bool>.Success(true);

        var since = DateTime.UtcNow.AddDays(-1);
        if (await _db.ChatReports.CountAsync(r => r.ReporterMemberId == memberId && r.CreatedTime >= since, ct) >= MaxReportsPerDay)
            return Result<bool>.Failure("今天檢舉的次數已達上限，請明天再試");

        var detail = string.IsNullOrWhiteSpace(request.Detail) ? null : request.Detail.Trim();
        var report = new ChatReport
        {
            ChatRecordId = chatRecordId,
            ReporterMemberId = memberId,
            ReportedMemberId = peerId.Value,
            Reason = (ChatReportReason)request.Reason,
            Detail = detail,
        };
        _db.ChatReports.Add(report);
        await _db.SaveChangesAsync(ct);

        _staff.Notify(
            "【SPS】會員檢舉了一則會員對話",
            "有會員檢舉了會員之間的對話，請到後台「會員檢舉」審閱",
            new (string, string?)[]
            {
                ("檢舉人", await DisplayNameAsync(memberId, ct)),
                ("被檢舉人", await DisplayNameAsync(peerId.Value, ct)),
                ("原因", ReasonLabel(report.Reason)),
                ("說明", detail),
            },
            "/chat-reports");

        return Result<bool>.Success(true);
    }

    public async Task<Result<PagedResult<ChatReportAdminDto>>> GetReportsAsync(bool? reviewed, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.ChatReports.AsNoTracking().AsQueryable();
        if (reviewed == true) query = query.Where(r => r.Status == ChatReportStatus.Reviewed);
        else if (reviewed == false) query = query.Where(r => r.Status == ChatReportStatus.New);

        var total = await query.CountAsync(ct);
        var rows = await query.OrderBy(r => r.Status).ThenByDescending(r => r.CreatedTime)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = await ToAdminDtosAsync(rows, ct);
        return Result<PagedResult<ChatReportAdminDto>>.Success(new PagedResult<ChatReportAdminDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize });
    }

    public async Task<Result<ChatReportDetailDto>> GetReportDetailAsync(int reportId, CancellationToken ct = default)
    {
        var report = await _db.ChatReports.AsNoTracking().FirstOrDefaultAsync(r => r.Id == reportId, ct);
        if (report == null) return Result<ChatReportDetailDto>.Failure("檢舉單不存在");
        return Result<ChatReportDetailDto>.Success(await ToDetailAsync(report, ct));
    }

    public async Task<Result<ChatReportDetailDto>> UpdateReportAsync(int reportId, UpdateChatReportRequest request, Guid? handledByUserId, CancellationToken ct = default)
    {
        var report = await _db.ChatReports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
        if (report == null) return Result<ChatReportDetailDto>.Failure("檢舉單不存在");

        var wasNew = report.Status == ChatReportStatus.New;
        report.Status = request.Reviewed ? ChatReportStatus.Reviewed : ChatReportStatus.New;
        report.HandlerNote = string.IsNullOrWhiteSpace(request.HandlerNote) ? null : request.HandlerNote.Trim();
        report.HandledByUserId = handledByUserId;
        report.HandledTime = request.Reviewed ? DateTime.UtcNow : null;
        report.UpdatedTime = DateTime.UtcNow;

        if (request.CloseChat)
        {
            await _db.ChatRecords.Where(c => c.Id == report.ChatRecordId && c.Status != ChatStatus.Closed)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.Status, ChatStatus.Closed).SetProperty(c => c.UpdatedTime, DateTime.UtcNow), ct);
        }

        await _db.SaveChangesAsync(ct);

        // 第一次標為已處理時通知檢舉人（不透露處理內容與備註）
        if (wasNew && request.Reviewed)
        {
            await _inbox.AddAsync(report.ReporterMemberId, MemberNotificationType.ChatReportHandled,
                "您的檢舉已處理", "承辦人員已審閱您檢舉的對話，謝謝您的回報。", null, ct);
        }

        return Result<ChatReportDetailDto>.Success(await ToDetailAsync(report, ct));
    }

    // ===== 私有 =====

    private static Guid? PeerOf(ChatRecord chat, Guid memberId)
    {
        if (chat.InitiatorMemberId == memberId) return chat.TargetMemberId;
        if (chat.TargetMemberId == memberId) return chat.InitiatorMemberId;
        return null;
    }

    private Task<bool> IsBlockedEitherWayAsync(Guid a, Guid b, CancellationToken ct) =>
        _db.MemberBlocks.AsNoTracking().AnyAsync(x => (x.BlockerMemberId == a && x.BlockedMemberId == b) || (x.BlockerMemberId == b && x.BlockedMemberId == a), ct);

    private async Task<string> DisplayNameAsync(Guid memberId, CancellationToken ct)
    {
        var m = await _db.Members.AsNoTracking().Include(x => x.Person).Include(x => x.Company).FirstOrDefaultAsync(x => x.Id == memberId, ct);
        if (m == null) return "會員";
        var name = m.Person?.Name ?? m.Nickname ?? "會員";
        return m.Company?.Name is { Length: > 0 } company ? $"{company} {name}" : name;
    }

    private static string ReasonLabel(ChatReportReason reason) => reason switch
    {
        ChatReportReason.Harassment => "騷擾或不當言論",
        ChatReportReason.Spam => "廣告或垃圾訊息",
        ChatReportReason.Fraud => "詐騙或可疑",
        _ => "其他",
    };

    private async Task<List<ChatReportAdminDto>> ToAdminDtosAsync(List<ChatReport> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new List<ChatReportAdminDto>();

        var memberIds = rows.SelectMany(r => new[] { r.ReporterMemberId, r.ReportedMemberId }).Distinct().ToList();
        var members = await _db.Members.AsNoTracking().Include(m => m.Person).Include(m => m.Company)
            .Where(m => memberIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, ct);

        var chatIds = rows.Select(r => r.ChatRecordId).Distinct().ToList();
        var chats = await _db.ChatRecords.AsNoTracking().Where(c => chatIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, ct);
        var demandIds = chats.Values.Where(c => c.DemandId.HasValue).Select(c => c.DemandId!.Value).Distinct().ToList();
        var demandNames = demandIds.Count == 0
            ? new Dictionary<int, string>()
            : await _db.Demands.AsNoTracking().Where(d => demandIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name, ct);

        string? NameOf(Guid id) => members.TryGetValue(id, out var m) ? (m.Person?.Name ?? m.Nickname) : null;
        string? CompanyOf(Guid id) => members.TryGetValue(id, out var m) ? m.Company?.Name : null;

        return rows.Select(r =>
        {
            chats.TryGetValue(r.ChatRecordId, out var chat);
            return new ChatReportAdminDto
            {
                Id = r.Id,
                ChatRecordId = r.ChatRecordId,
                DemandId = chat?.DemandId,
                DemandName = chat?.DemandId is { } demandId ? demandNames.GetValueOrDefault(demandId) : null,
                ReporterName = NameOf(r.ReporterMemberId),
                ReporterCompany = CompanyOf(r.ReporterMemberId),
                ReportedName = NameOf(r.ReportedMemberId),
                ReportedCompany = CompanyOf(r.ReportedMemberId),
                Reason = r.Reason.ToString(),
                Detail = r.Detail,
                Status = r.Status.ToString(),
                HandlerNote = r.HandlerNote,
                HandledTime = r.HandledTime,
                CreatedTime = r.CreatedTime,
                ChatClosed = chat?.Status == ChatStatus.Closed,
            };
        }).ToList();
    }

    private async Task<ChatReportDetailDto> ToDetailAsync(ChatReport report, CancellationToken ct)
    {
        var dto = (await ToAdminDtosAsync(new List<ChatReport> { report }, ct)).First();
        return new ChatReportDetailDto
        {
            Id = dto.Id,
            ChatRecordId = dto.ChatRecordId,
            DemandId = dto.DemandId,
            DemandName = dto.DemandName,
            ReporterName = dto.ReporterName,
            ReporterCompany = dto.ReporterCompany,
            ReportedName = dto.ReportedName,
            ReportedCompany = dto.ReportedCompany,
            Reason = dto.Reason,
            Detail = dto.Detail,
            Status = dto.Status,
            HandlerNote = dto.HandlerNote,
            HandledTime = dto.HandledTime,
            CreatedTime = dto.CreatedTime,
            ChatClosed = dto.ChatClosed,
            // 只有被檢舉的對話才讀得到訊息
            Messages = await _chat.GetMessagesAsync(report.ChatRecordId, 0, 500, ct),
        };
    }
}
