using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.MemberNotification;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 會員收件匣（見 <see cref="MemberNotification"/>）。只能讀寫自己的通知；寫入失敗只記 log，不影響原本流程。
/// 標題與內文長度、連結格式在這裡統一檢查（連結只接受站內路徑，避免通知被拿來導去外部網站）。
/// </summary>
public class MemberNotificationService : IMemberNotificationService
{
    private const int MaxTitle = 200;
    private const int MaxContent = 4000;
    private const int MaxPageSize = 50;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MemberNotificationService> _logger;

    public MemberNotificationService(IUnitOfWork unitOfWork, ILogger<MemberNotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    private DbContext Db => _unitOfWork.GetDbContext();

    public Task AddAsync(Guid memberId, MemberNotificationType type, string title, string? content, string? linkPath, CancellationToken ct = default)
        => AddToManyAsync(new[] { memberId }, type, title, content, linkPath, ct);

    public async Task AddToManyAsync(IEnumerable<Guid> memberIds, MemberNotificationType type, string title, string? content, string? linkPath, CancellationToken ct = default)
    {
        try
        {
            var ids = memberIds.Where(id => id != Guid.Empty).Distinct().ToList();
            if (ids.Count == 0) return;

            var safeTitle = Truncate(title, MaxTitle) ?? string.Empty;
            var safeContent = Truncate(content, MaxContent);
            var safeLink = linkPath is { Length: > 0 } && linkPath.StartsWith('/') && !linkPath.StartsWith("//") && !linkPath.Contains('\\') ? linkPath : null;

            foreach (var id in ids)
            {
                Db.Set<MemberNotification>().Add(new MemberNotification
                {
                    MemberId = id,
                    Type = type,
                    Title = safeTitle,
                    Content = safeContent,
                    LinkPath = safeLink,
                });
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "寫入會員通知失敗（種類 {Type}）", type);
        }
    }

    public async Task<MemberNotificationListResponse> GetListAsync(Guid memberId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = Db.Set<MemberNotification>().AsNoTracking().Where(n => n.MemberId == memberId);
        var unread = await query.CountAsync(n => !n.IsRead, ct);
        if (unreadOnly) query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(n => n.CreatedTime).ThenByDescending(n => n.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(n => new MemberNotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Title = n.Title,
                Content = n.Content,
                LinkPath = n.LinkPath,
                IsRead = n.IsRead,
                CreatedTime = n.CreatedTime,
            })
            .ToListAsync(ct);

        return new MemberNotificationListResponse { Items = items, TotalCount = total, UnreadCount = unread };
    }

    public Task<int> GetUnreadCountAsync(Guid memberId, CancellationToken ct = default)
        => Db.Set<MemberNotification>().AsNoTracking().CountAsync(n => n.MemberId == memberId && !n.IsRead, ct);

    public async Task MarkReadAsync(Guid memberId, long id, CancellationToken ct = default)
    {
        // 只能標記自己的通知；別人的 id 直接當作沒有，不回報是否存在
        await Db.Set<MemberNotification>()
            .Where(n => n.Id == id && n.MemberId == memberId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, DateTime.UtcNow), ct);
    }

    public async Task MarkAllReadAsync(Guid memberId, CancellationToken ct = default)
    {
        await Db.Set<MemberNotification>()
            .Where(n => n.MemberId == memberId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, DateTime.UtcNow), ct);
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length > max ? trimmed[..max] : trimmed;
    }
}
