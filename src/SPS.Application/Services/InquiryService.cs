using System.Net.Mail;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Inquiry;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 詢問單：前台各個「留下資料等人回覆」的表單共用。每種表單要填哪些欄位、誰能送出，都集中在 <see cref="Rules"/>。
/// </summary>
public class InquiryService : IInquiryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<InquiryService> _logger;
    private readonly IStaffNotifier _notifier;

    public InquiryService(IUnitOfWork unitOfWork, ILogger<InquiryService> logger, IStaffNotifier notifier)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _notifier = notifier;
    }

    private enum Who
    {
        /// <summary>任何人（匿名也可以），要勾選個資同意</summary>
        Anyone,

        /// <summary>登入的會員</summary>
        Member,

        /// <summary>登入的企業會員（Supplier／Buyer）</summary>
        EnterpriseMember,
    }

    private sealed record Rule(Who Who, string TypeName, bool NeedName, bool NeedEmail, bool NeedPhone, bool NeedCompany, bool NeedUnit, bool NeedJobTitle, bool NeedTarget);

    private static readonly Dictionary<InquiryType, Rule> Rules = new()
    {
        [InquiryType.ProposeSolution] = new(Who.EnterpriseMember, "我要提案", true, true, true, true, false, false, true),
        [InquiryType.SubscribeSolution] = new(Who.Member, "訂閱解方", false, false, false, false, false, false, false),
        [InquiryType.DownloadRequest] = new(Who.Anyone, "下載申請", true, true, true, true, true, true, false),
        [InquiryType.SupportRequest] = new(Who.Anyone, "索取補助資料", true, false, true, false, false, false, true),
        [InquiryType.Newsletter] = new(Who.Anyone, "訂閱電子報", false, true, false, false, false, false, false),
    };

    private static string TypeNameOf(InquiryType type) => Rules.TryGetValue(type, out var rule) ? rule.TypeName : type.ToString();

    public async Task<Result<bool>> CreateAsync(CreateInquiryRequest request, Guid? memberId, bool isEnterpriseMember, string? clientIp, CancellationToken ct = default)
    {
        // 誘捕欄位有值就是機器人：假裝成功，什麼都不存
        if (!string.IsNullOrWhiteSpace(request.Website)) return Result<bool>.Success(true);

        if (!Rules.TryGetValue(request.Type, out var rule)) return Result<bool>.Failure("不支援的表單種類");

        if (rule.Who != Who.Anyone && memberId == null) return Result<bool>.Failure("請先登入會員");
        if (rule.Who == Who.EnterpriseMember && !isEnterpriseMember) return Result<bool>.Failure("僅企業會員可以使用這個功能");
        if (rule.Who == Who.Anyone && !request.ConsentAccepted) return Result<bool>.Failure("請先閱讀並同意個資蒐集告知");

        var name = Clean(request.Name);
        var email = Clean(request.Email);
        var phone = Clean(request.Phone);
        var company = Clean(request.CompanyName);
        var unit = Clean(request.Unit);
        var jobTitle = Clean(request.JobTitle);
        var targetKey = Clean(request.TargetKey);
        var targetTitle = Clean(request.TargetTitle);

        string? missing = null;
        if (rule.NeedName && name == null) missing = "姓名";
        else if (rule.NeedEmail && email == null) missing = "信箱";
        else if (rule.NeedPhone && phone == null) missing = "電話";
        else if (rule.NeedCompany && company == null) missing = "公司名稱";
        else if (rule.NeedUnit && unit == null) missing = "單位";
        else if (rule.NeedJobTitle && jobTitle == null) missing = "職稱";
        else if (rule.NeedTarget && (targetKey == null || targetTitle == null)) missing = "對象";
        if (missing != null) return Result<bool>.Failure($"請填寫{missing}");

        if (email != null && !IsValidEmail(email)) return Result<bool>.Failure("信箱格式不正確");

        // 訂閱解方：信箱與電話用會員資料；已經有一筆還沒結案的就不重複建立（視為成功）
        if (request.Type == InquiryType.SubscribeSolution)
        {
            var member = await _unitOfWork.Members.GetByIdAsync(memberId!.Value, ct);
            if (member == null) return Result<bool>.Failure("找不到會員資料");
            if (await _unitOfWork.Inquiries.HasOpenAsync(member.Id, InquiryType.SubscribeSolution, ct)) return Result<bool>.Success(true);
            email = member.Email;
            phone = string.IsNullOrWhiteSpace(member.MobilePhone) ? member.Phone : member.MobilePhone;
            company = member.CompanyName;
        }

        var industry = Clean(request.Industry);
        var inquiry = new Inquiry
        {
            Id = Guid.NewGuid(),
            Type = request.Type,
            Status = InquiryStatus.New,
            MemberId = memberId,
            Name = name,
            Email = email,
            Phone = phone,
            CompanyName = company,
            Unit = unit,
            JobTitle = jobTitle,
            Message = Clean(request.Message),
            TargetType = Clean(request.TargetType),
            TargetKey = targetKey,
            TargetTitle = targetTitle,
            Extra = industry == null ? null : JsonSerializer.Serialize(new { industry }),
            ClientIp = clientIp,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow,
        };
        await _unitOfWork.Inquiries.AddAsync(inquiry, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogInformation("Inquiry created: {Id} type={Type} member={MemberId}", inquiry.Id, inquiry.Type, memberId);

        // 要人工回覆的種類才寄信通知承辦人員；訂閱電子報與訂閱解方只是登記名單，不寄
        if (request.Type is InquiryType.ProposeSolution or InquiryType.DownloadRequest or InquiryType.SupportRequest)
        {
            var typeName = TypeNameOf(inquiry.Type);
            _notifier.Notify(
                $"【SPS】新的詢問單：{typeName}",
                $"收到一筆新的「{typeName}」詢問單",
                new (string, string?)[]
                {
                    ("種類", typeName),
                    ("針對", inquiry.TargetTitle),
                    ("姓名", inquiry.Name),
                    ("公司", inquiry.CompanyName),
                    ("單位／職稱", string.Join(" ／ ", new[] { inquiry.Unit, inquiry.JobTitle }.Where(v => !string.IsNullOrWhiteSpace(v)))),
                    ("信箱", inquiry.Email),
                    ("電話", inquiry.Phone),
                    ("補充說明", inquiry.Message),
                },
                "/inquiries");
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<PagedResult<InquiryResponse>>> GetPagedAsync(InquiryQueryParameters parameters, CancellationToken ct = default)
    {
        var paged = await _unitOfWork.Inquiries.GetPagedAsync(parameters, ct);
        return Result<PagedResult<InquiryResponse>>.Success(new PagedResult<InquiryResponse>
        {
            Items = paged.Items.Select(Map).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize,
        });
    }

    public async Task<Result<InquiryResponse>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var inquiry = await _unitOfWork.Inquiries.GetByIdAsync(id, ct);
        return inquiry == null ? Result<InquiryResponse>.Failure("詢問單不存在") : Result<InquiryResponse>.Success(Map(inquiry));
    }

    public async Task<Result<InquiryResponse>> UpdateAsync(Guid id, UpdateInquiryRequest request, Guid? handledByUserId, CancellationToken ct = default)
    {
        var inquiry = await _unitOfWork.Inquiries.GetByIdAsync(id, ct);
        if (inquiry == null) return Result<InquiryResponse>.Failure("詢問單不存在");

        inquiry.Status = request.Status;
        inquiry.HandlerNote = Clean(request.HandlerNote);
        inquiry.HandledByUserId = handledByUserId;
        inquiry.HandledTime = request.Status == InquiryStatus.New ? null : DateTime.UtcNow;
        inquiry.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.Inquiries.UpdateAsync(inquiry, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result<InquiryResponse>.Success(Map(inquiry));
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var inquiry = await _unitOfWork.Inquiries.GetByIdAsync(id, ct);
        if (inquiry == null) return Result<bool>.Failure("詢問單不存在");
        await _unitOfWork.Inquiries.DeleteAsync(inquiry, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<InquiryCountsResponse>> GetCountsAsync(CancellationToken ct = default) =>
        Result<InquiryCountsResponse>.Success(await _unitOfWork.Inquiries.GetCountsAsync(ct));

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsValidEmail(string value)
    {
        if (value.Length > 320) return false;
        try
        {
            var address = new MailAddress(value);
            return address.Address == value && value.Contains('.', StringComparison.Ordinal);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static InquiryResponse Map(Inquiry i)
    {
        string? industry = null;
        if (!string.IsNullOrEmpty(i.Extra))
        {
            try
            {
                using var doc = JsonDocument.Parse(i.Extra);
                if (doc.RootElement.TryGetProperty("industry", out var value)) industry = value.GetString();
            }
            catch (JsonException)
            {
                // 額外資料格式不對不影響列表
            }
        }

        return new InquiryResponse
        {
            Id = i.Id,
            Type = i.Type,
            TypeName = TypeNameOf(i.Type),
            Status = i.Status,
            MemberId = i.MemberId,
            Name = i.Name,
            Email = i.Email,
            Phone = i.Phone,
            CompanyName = i.CompanyName,
            Unit = i.Unit,
            JobTitle = i.JobTitle,
            Message = i.Message,
            TargetType = i.TargetType,
            TargetKey = i.TargetKey,
            TargetTitle = i.TargetTitle,
            Industry = industry,
            HandlerNote = i.HandlerNote,
            HandledTime = i.HandledTime,
            CreatedTime = i.CreatedTime,
        };
    }
}
