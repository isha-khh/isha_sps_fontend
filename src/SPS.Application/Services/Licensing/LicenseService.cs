using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.License;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using static SPS.Domain.Enums.LicenseConstants;

namespace SPS.Application.Services.Licensing;

/// <summary>
/// 軟體授權（XR）的授權伺服器邏輯。設計見 docs/xr-license/第一期設計與API規格.md。
///
/// - 資格（企業、需求端或兼營、審核通過、未停用）在每次啟用與續期時重新檢查，授權狀態跟著會員狀態走。
/// - 序號只存雜湊；明文只在建立／重新產生當下回傳一次。
/// - 簽章由 <see cref="ILicenseSigner"/>（Cloud KMS）完成；先簽章成功才寫入資料庫，簽章失敗不留下半套資料。
/// - 所有狀態變更都寫 <see cref="LicenseEvent"/>（只新增）。
/// </summary>
public class LicenseService : ILicenseService
{
    private const string SettingsCategory = "License";
    private static readonly Regex KidPattern = new("^[a-z0-9][a-z0-9._-]{1,58}$", RegexOptions.Compiled);
    private static readonly Regex KmsVersionPattern = new(@"^projects/[^/\s]+/locations/[^/\s]+/keyRings/[^/\s]+/cryptoKeys/[^/\s]+/cryptoKeyVersions/[^/\s]+$", RegexOptions.Compiled);

    private readonly IUnitOfWork _unitOfWork;
    private readonly ISystemSettingService _settingService;
    private readonly ILicenseSigner _signer;
    private readonly ILogger<LicenseService> _logger;
    private readonly TimeProvider _time;

    public LicenseService(IUnitOfWork unitOfWork, ISystemSettingService settingService, ILicenseSigner signer, ILogger<LicenseService> logger, TimeProvider time)
    {
        _unitOfWork = unitOfWork;
        _settingService = settingService;
        _signer = signer;
        _logger = logger;
        _time = time;
    }

    private DbContext Db => _unitOfWork.GetDbContext();
    private DateTime Now => _time.GetUtcNow().UtcDateTime;

    // =====================================================================================
    // 設定與資格
    // =====================================================================================

    public async Task<LicenseSettingsDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var result = await _settingService.GetSettingAsync<LicenseSettingsDto>(SettingsCategory, ct);
        var settings = result.IsSuccess ? result.Data ?? new LicenseSettingsDto() : new LicenseSettingsDto();
        // 資料庫裡若有超出範圍的髒資料，退回預設值，不讓授權服務因此失效
        return LicenseSettingsDto.Validate(settings) == null ? settings : new LicenseSettingsDto();
    }

    /// <summary>資格判斷（純函式，方便測試）：企業會員、需求端（或兼營的企業）、審核通過、帳號與公司都未停用</summary>
    public static (bool Eligible, string? Reason) EvaluateEligibility(Member? member, Company? company)
    {
        if (member == null) return (false, "找不到會員資料");
        if (member.Status != Status.Active) return (false, "帳號目前不是啟用狀態");
        if (!member.IsApproved) return (false, "會員申請尚未審核通過");
        if (member.CompanyId == null || company == null) return (false, "XR 僅提供企業會員使用");
        if (company.Status != Status.Active) return (false, "所屬企業目前不是啟用狀態");

        var buyerSide = member.Role == MemberRole.Buyer
                        || company.Type is CompanyType.Buyer or CompanyType.Both
                        || company.MemberRole == MemberRole.Buyer;
        return buyerSide ? (true, null) : (false, "XR 僅提供需求端企業會員使用");
    }

    private async Task<(Member? Member, Company? Company)> LoadMemberAsync(Guid memberId, CancellationToken ct)
    {
        var member = await Db.Set<Member>().AsNoTracking().Include(m => m.Person).FirstOrDefaultAsync(m => m.Id == memberId, ct);
        Company? company = null;
        if (member?.CompanyId != null)
            company = await Db.Set<Company>().AsNoTracking().FirstOrDefaultAsync(c => c.Id == member.CompanyId, ct);
        return (member, company);
    }

    private static string CustomerName(Member? member, Company? company)
        => company?.Name ?? member?.CompanyName ?? member?.Person?.Name ?? member?.Nickname ?? string.Empty;

    private static string StatusText(License license, DateTime now)
    {
        if (license.Status == LicenseStatus.Active && license.ValidUntil.HasValue && license.ValidUntil.Value < now) return "expired";
        return license.Status.ToString().ToLowerInvariant();
    }

    private void AddEvent(Guid? licenseId, Guid? activationId, string type, string actor, object? detail, string? ip)
    {
        Db.Set<LicenseEvent>().Add(new LicenseEvent
        {
            LicenseId = licenseId,
            ActivationId = activationId,
            EventType = type,
            Actor = actor.Length > 80 ? actor[..80] : actor,
            Detail = detail == null ? null : JsonSerializer.Serialize(detail),
            Ip = ip?.Length > 64 ? ip[..64] : ip,
            CreatedTime = Now,
        });
    }

    // =====================================================================================
    // 簽發
    // =====================================================================================

    private async Task<LicenseSigningKey?> GetActiveKeyAsync(CancellationToken ct)
    {
        var now = Now;
        return await Db.Set<LicenseSigningKey>().AsNoTracking()
            .Where(k => k.Status == SigningKeyStatus.Active && (k.NotAfter == null || k.NotAfter > now))
            .OrderByDescending(k => k.CreatedTime)
            .FirstOrDefaultAsync(ct);
    }

    /// <summary>組出並簽章授權檔；同時算出這次的租約到期時間。簽章失敗丟出例外，由呼叫端轉成 service_unavailable</summary>
    private async Task<(string License, DateTime LeaseUntil, DateTime ServerTime)> IssueAsync(
        License license, string deviceHash, Member member, Company? company, LicenseSigningKey key, LicenseSettingsDto settings, CancellationToken ct)
    {
        var now = Now;
        var leaseUntil = now.AddDays(license.LeaseDaysOverride ?? settings.LeaseDays);
        // 沒有手動設定期限＝跟著會員資格走（每次續期往後滾動）；有設定就是上限
        var validUntil = license.ValidUntil ?? leaseUntil;
        if (license.ValidUntil.HasValue && validUntil < leaseUntil) leaseUntil = validUntil;

        var payload = new LicensePayload
        {
            Kid = key.Kid,
            LicenseId = license.Id.ToString(),
            Product = license.ProductCode,
            Customer = CustomerName(member, company),
            MemberId = license.MemberId.ToString(),
            Edition = "standard",
            Features = Array.Empty<string>(),
            Seats = license.SeatsOverride ?? settings.DefaultSeats,
            DeviceHash = deviceHash,
            IssuedAt = LicensePayload.FormatTime(now),
            ValidUntil = LicensePayload.FormatTime(validUntil),
            LeaseUntil = LicensePayload.FormatTime(leaseUntil),
            ServerTime = LicensePayload.FormatTime(now),
        };
        var bytes = payload.ToBytes();
        var signature = await _signer.SignAsync(key.KmsKeyVersion, bytes, ct);
        return (LicensePayload.Compose(bytes, signature), leaseUntil, now);
    }

    /// <summary>檢查授權本身與會員資格能不能繼續使用；通過回 null，否則回對外的錯誤</summary>
    private LicenseResult<T>? CheckUsable<T>(License license, Member? member, Company? company)
    {
        if (license.Status == LicenseStatus.Revoked)
            return LicenseResult<T>.Fail(LicenseErrors.LicenseRevoked, "此授權已被撤銷，請聯絡客服", 403);
        if (license.Status == LicenseStatus.Suspended)
            return LicenseResult<T>.Fail(LicenseErrors.LicenseSuspended, "此授權已暫停，請聯絡客服", 403);
        if (license.ValidUntil.HasValue && license.ValidUntil.Value < Now)
            return LicenseResult<T>.Fail(LicenseErrors.LicenseExpired, "此授權已過期", 403);

        var (eligible, reason) = EvaluateEligibility(member, company);
        if (!eligible)
            return LicenseResult<T>.Fail(LicenseErrors.NotEligible, reason ?? "目前不具備使用資格", 403);
        return null;
    }

    private static LicenseResult<T> SigningUnavailable<T>()
        => LicenseResult<T>.Fail(LicenseErrors.ServiceUnavailable, "授權服務暫時無法簽發，請稍後再試", 503);

    // =====================================================================================
    // 對外 API
    // =====================================================================================

    public async Task<LicenseResult<LicenseIssueResponse>> ActivateAsync(LicenseActivateRequest request, string? ip, CancellationToken ct = default)
    {
        var normalized = LicenseKeyGenerator.Normalize(request.LicenseKey);
        if (normalized == null)
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.InvalidKey, "序號格式不正確", 400);

        var deviceError = ValidateDevice(request.DeviceHash, request.DeviceName);
        if (deviceError != null)
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.InvalidRequest, deviceError, 400);
        var deviceHash = request.DeviceHash!.Trim();
        var deviceName = request.DeviceName!.Trim();

        var hash = LicenseCrypto.Sha256Hex(normalized);
        var license = await Db.Set<License>().Include(l => l.Activations).FirstOrDefaultAsync(l => l.LicenseKeyHash == hash, ct);
        if (license == null)
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.InvalidKey, "序號不存在", 404);

        var (member, company) = await LoadMemberAsync(license.MemberId, ct);
        var denied = CheckUsable<LicenseIssueResponse>(license, member, company);
        if (denied != null)
        {
            AddEvent(license.Id, null, Events.ActivateDenied, "device", new { code = denied.ErrorCode, device = deviceName }, ip);
            await Db.SaveChangesAsync(ct);
            return denied;
        }

        var key = await GetActiveKeyAsync(ct);
        if (key == null)
        {
            _logger.LogError("授權簽發失敗：沒有可用的簽章金鑰（後台「XR 授權 → 簽章金鑰」尚未登錄或已過期）");
            return SigningUnavailable<LicenseIssueResponse>();
        }

        var settings = await GetSettingsAsync(ct);
        var seats = license.SeatsOverride ?? settings.DefaultSeats;

        // 席次檢查與寫入放在同一個交易，並鎖住這份授權，避免同時啟用兩台超過席次
        await using var tx = await _unitOfWork.BeginTransactionAsync(ct);
        await Db.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM \"Licenses\" WHERE \"Id\" = {license.Id} FOR UPDATE", ct);
        // 拿到鎖之後重新讀取：載入鎖定期間別的請求新增的裝置，並刷新已追蹤裝置的最新狀態
        await Db.Entry(license).Collection(l => l.Activations).LoadAsync(ct);
        foreach (var tracked in license.Activations.ToList()) await Db.Entry(tracked).ReloadAsync(ct);

        var activation = license.Activations.FirstOrDefault(a => a.DeviceHash == deviceHash);
        if (activation is { Status: ActivationStatus.Revoked })
        {
            AddEvent(license.Id, activation.Id, Events.ActivateDenied, "device", new { code = LicenseErrors.DeviceNotAllowed, device = deviceName }, ip);
            await Db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.DeviceNotAllowed, "這台裝置已被停用，請聯絡客服", 403);
        }

        var isNewSeat = activation is not { Status: ActivationStatus.Active };
        if (isNewSeat && license.Activations.Count(a => a.Status == ActivationStatus.Active) >= seats)
        {
            AddEvent(license.Id, null, Events.ActivateDenied, "device", new { code = LicenseErrors.SeatsExceeded, device = deviceName, seats }, ip);
            await Db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.SeatsExceeded, "席次已滿，請到會員中心停用不用的裝置", 409);
        }

        (string License, DateTime LeaseUntil, DateTime ServerTime) issued;
        try
        {
            issued = await IssueAsync(license, deviceHash, member!, company, key, settings, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "授權簽章失敗（kid={Kid}）", key.Kid);
            return SigningUnavailable<LicenseIssueResponse>();
        }

        var now = Now;
        if (activation == null)
        {
            activation = new LicenseActivation { Id = Guid.NewGuid(), LicenseId = license.Id, DeviceHash = deviceHash, FirstActivatedAt = now };
            Db.Set<LicenseActivation>().Add(activation);
        }
        else if (activation.Status != ActivationStatus.Active)
        {
            activation.FirstActivatedAt = now; // 停用後重新啟用，視為新的一次啟用
        }
        activation.DeviceName = deviceName;
        activation.Status = ActivationStatus.Active;
        activation.ActivationMode = ModeOnline;
        activation.LastSeenAt = now;
        activation.LastIp = ip;
        activation.ClientVersion = request.ClientVersion?.Trim() is { Length: > 0 } v ? v[..Math.Min(v.Length, 50)] : null;
        activation.LeaseUntil = issued.LeaseUntil;
        activation.UpdatedTime = now;

        AddEvent(license.Id, activation.Id, Events.Activated, "device", new { device = deviceName, kid = key.Kid, lease_until = LicensePayload.FormatTime(issued.LeaseUntil), reactivated = !isNewSeat }, ip);
        await Db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return LicenseResult<LicenseIssueResponse>.Ok(new LicenseIssueResponse { License = issued.License, ServerTime = LicensePayload.FormatTime(issued.ServerTime) });
    }

    public async Task<LicenseResult<LicenseIssueResponse>> RefreshAsync(LicenseRefreshRequest request, string? ip, CancellationToken ct = default)
    {
        var deviceError = ValidateDevice(request.DeviceHash, "-");
        if (deviceError != null)
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.InvalidRequest, deviceError, 400);
        var deviceHash = request.DeviceHash!.Trim();

        var verified = await VerifyTokenAsync(request.License, deviceHash, ct);
        if (!verified.Success) return LicenseResult<LicenseIssueResponse>.Fail(verified.ErrorCode, verified.Message, verified.HttpStatus);
        var licenseId = verified.Data;

        var license = await Db.Set<License>().Include(l => l.Activations).FirstOrDefaultAsync(l => l.Id == licenseId, ct);
        var activation = license?.Activations.FirstOrDefault(a => a.DeviceHash == deviceHash);
        if (license == null || activation == null || activation.Status != ActivationStatus.Active)
        {
            if (license != null)
            {
                AddEvent(license.Id, activation?.Id, Events.RefreshDenied, "device", new { code = LicenseErrors.DeviceNotAllowed }, ip);
                await Db.SaveChangesAsync(ct);
            }
            return LicenseResult<LicenseIssueResponse>.Fail(LicenseErrors.DeviceNotAllowed, "這台裝置沒有有效的啟用，請重新啟用", 403);
        }

        var (member, company) = await LoadMemberAsync(license.MemberId, ct);
        var denied = CheckUsable<LicenseIssueResponse>(license, member, company);
        if (denied != null)
        {
            AddEvent(license.Id, activation.Id, Events.RefreshDenied, "device", new { code = denied.ErrorCode }, ip);
            await Db.SaveChangesAsync(ct);
            return denied;
        }

        var key = await GetActiveKeyAsync(ct);
        if (key == null)
        {
            _logger.LogError("授權續期失敗：沒有可用的簽章金鑰");
            return SigningUnavailable<LicenseIssueResponse>();
        }

        var settings = await GetSettingsAsync(ct);
        (string License, DateTime LeaseUntil, DateTime ServerTime) issued;
        try
        {
            issued = await IssueAsync(license, deviceHash, member!, company, key, settings, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "授權續期簽章失敗（kid={Kid}）", key.Kid);
            return SigningUnavailable<LicenseIssueResponse>();
        }

        var now = Now;
        activation.LastSeenAt = now;
        activation.LastIp = ip;
        activation.ClientVersion = request.ClientVersion?.Trim() is { Length: > 0 } v ? v[..Math.Min(v.Length, 50)] : activation.ClientVersion;
        activation.LeaseUntil = issued.LeaseUntil;
        activation.UpdatedTime = now;
        AddEvent(license.Id, activation.Id, Events.Refreshed, "device", new { kid = key.Kid, lease_until = LicensePayload.FormatTime(issued.LeaseUntil) }, ip);
        await Db.SaveChangesAsync(ct);

        return LicenseResult<LicenseIssueResponse>.Ok(new LicenseIssueResponse { License = issued.License, ServerTime = LicensePayload.FormatTime(issued.ServerTime) });
    }

    public async Task<LicenseResult<LicenseOkResponse>> DeactivateAsync(LicenseDeactivateRequest request, string? ip, CancellationToken ct = default)
    {
        var deviceError = ValidateDevice(request.DeviceHash, "-");
        if (deviceError != null)
            return LicenseResult<LicenseOkResponse>.Fail(LicenseErrors.InvalidRequest, deviceError, 400);
        var deviceHash = request.DeviceHash!.Trim();

        var verified = await VerifyTokenAsync(request.License, deviceHash, ct);
        if (!verified.Success) return LicenseResult<LicenseOkResponse>.Fail(verified.ErrorCode, verified.Message, verified.HttpStatus);

        var activation = await Db.Set<LicenseActivation>().FirstOrDefaultAsync(a => a.LicenseId == verified.Data && a.DeviceHash == deviceHash, ct);
        // 已經停用或找不到：視為成功（冪等），客戶端清掉本機授權即可
        if (activation is { Status: ActivationStatus.Active })
        {
            activation.Status = ActivationStatus.Deactivated;
            activation.UpdatedTime = Now;
            AddEvent(verified.Data, activation.Id, Events.Deactivated, "device", new { device = activation.DeviceName }, ip);
            await Db.SaveChangesAsync(ct);
        }
        return LicenseResult<LicenseOkResponse>.Ok(new LicenseOkResponse());
    }

    /// <summary>驗證客戶端帶來的授權檔：格式、kid 對應的公鑰、簽章、產品、裝置指紋。回傳授權 Id</summary>
    private async Task<LicenseResult<Guid>> VerifyTokenAsync(string? license, string deviceHash, CancellationToken ct)
    {
        const string bad = "授權檔無效，請重新啟用";
        var parts = LicensePayload.Split(license);
        if (parts == null) return LicenseResult<Guid>.Fail(LicenseErrors.InvalidLicense, bad, 400);

        var payload = LicensePayload.Parse(parts.Value.Payload);
        if (payload == null || string.IsNullOrEmpty(payload.Kid) || !Guid.TryParse(payload.LicenseId, out var licenseId))
            return LicenseResult<Guid>.Fail(LicenseErrors.InvalidLicense, bad, 400);

        var now = Now;
        var key = await Db.Set<LicenseSigningKey>().AsNoTracking().FirstOrDefaultAsync(k => k.Kid == payload.Kid, ct);
        // 退役的金鑰只在公鑰附的 not_after 之前還被信任
        var trusted = key != null && (key.Status != SigningKeyStatus.Retired || (key.NotAfter.HasValue && key.NotAfter.Value > now))
                      && (key.NotAfter == null || key.NotAfter.Value > now);
        if (!trusted || !LicenseCrypto.Verify(key!.PublicKey, parts.Value.Payload, parts.Value.Signature))
            return LicenseResult<Guid>.Fail(LicenseErrors.InvalidLicense, bad, 401);

        if (payload.Product != LicenseConstants.ProductXr || payload.DeviceHash != deviceHash)
            return LicenseResult<Guid>.Fail(LicenseErrors.DeviceNotAllowed, "授權檔與這台裝置不符，請重新啟用", 403);

        return LicenseResult<Guid>.Ok(licenseId);
    }

    private static string? ValidateDevice(string? deviceHash, string? deviceName)
    {
        var hash = deviceHash?.Trim();
        if (string.IsNullOrEmpty(hash) || hash.Length is < 8 or > 200) return "device_hash 必須是 8 到 200 個字元的穩定字串";
        var name = deviceName?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 200) return "device_name 必填，且不可超過 200 個字元";
        return null;
    }

    public async Task<LicensePublicKeysResponse> GetPublicKeysAsync(CancellationToken ct = default)
    {
        var now = Now;
        var keys = await Db.Set<LicenseSigningKey>().AsNoTracking()
            .Where(k => k.Status != SigningKeyStatus.Retired || (k.NotAfter != null && k.NotAfter > now))
            .OrderBy(k => k.CreatedTime)
            .ToListAsync(ct);
        return new LicensePublicKeysResponse
        {
            Keys = keys.Select(k => new LicensePublicKeyDto
            {
                Kid = k.Kid,
                Spki = k.PublicKey,
                Status = k.Status.ToString().ToLowerInvariant(),
                NotAfter = k.NotAfter.HasValue ? LicensePayload.FormatTime(k.NotAfter.Value) : null,
            }).ToList()
        };
    }

    // =====================================================================================
    // 會員中心
    // =====================================================================================

    public async Task<MemberLicenseDto> GetMyLicenseAsync(Guid memberId, CancellationToken ct = default)
    {
        var (member, company) = await LoadMemberAsync(memberId, ct);
        var (eligible, reason) = EvaluateEligibility(member, company);
        var settings = await GetSettingsAsync(ct);
        var license = await Db.Set<License>().AsNoTracking().Include(l => l.Activations)
            .FirstOrDefaultAsync(l => l.MemberId == memberId && l.ProductCode == ProductXr, ct);
        return ToMemberDto(license, eligible, reason, settings, null);
    }

    public async Task<LicenseResult<MemberLicenseDto>> CreateMyLicenseAsync(Guid memberId, string? ip, CancellationToken ct = default)
    {
        var (member, company) = await LoadMemberAsync(memberId, ct);
        var (eligible, reason) = EvaluateEligibility(member, company);
        if (!eligible)
            return LicenseResult<MemberLicenseDto>.Fail(LicenseErrors.NotEligible, reason ?? "目前不具備使用資格", 403);

        var settings = await GetSettingsAsync(ct);
        var existing = await Db.Set<License>().AsNoTracking().Include(l => l.Activations)
            .FirstOrDefaultAsync(l => l.MemberId == memberId && l.ProductCode == ProductXr, ct);
        if (existing != null) return LicenseResult<MemberLicenseDto>.Ok(ToMemberDto(existing, true, null, settings, null));

        var (display, normalized) = LicenseKeyGenerator.Generate();
        var license = new License
        {
            Id = Guid.NewGuid(),
            ProductCode = ProductXr,
            LicenseKeyHash = LicenseCrypto.Sha256Hex(normalized),
            LicenseKeyHint = LicenseKeyGenerator.Mask(normalized),
            MemberId = memberId,
            CompanyId = member!.CompanyId,
            Status = LicenseStatus.Active,
        };
        Db.Set<License>().Add(license);
        AddEvent(license.Id, null, Events.Created, $"member:{memberId}", new { key_hint = license.LicenseKeyHint }, ip);
        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // 同一個會員同時按了兩次：另一個請求已經建立，回傳現況（不會再顯示序號）
            Db.ChangeTracker.Clear();
            var again = await Db.Set<License>().AsNoTracking().Include(l => l.Activations).FirstAsync(l => l.MemberId == memberId && l.ProductCode == ProductXr, ct);
            return LicenseResult<MemberLicenseDto>.Ok(ToMemberDto(again, true, null, settings, null));
        }
        return LicenseResult<MemberLicenseDto>.Ok(ToMemberDto(license, true, null, settings, display));
    }

    public async Task<LicenseResult<MemberLicenseDto>> RegenerateMyKeyAsync(Guid memberId, string? ip, CancellationToken ct = default)
    {
        var (member, company) = await LoadMemberAsync(memberId, ct);
        var (eligible, reason) = EvaluateEligibility(member, company);
        if (!eligible)
            return LicenseResult<MemberLicenseDto>.Fail(LicenseErrors.NotEligible, reason ?? "目前不具備使用資格", 403);

        var license = await Db.Set<License>().Include(l => l.Activations).FirstOrDefaultAsync(l => l.MemberId == memberId && l.ProductCode == ProductXr, ct);
        if (license == null)
            return LicenseResult<MemberLicenseDto>.Fail(LicenseErrors.InvalidKey, "尚未建立授權", 404);
        if (license.Status is LicenseStatus.Revoked or LicenseStatus.Suspended)
            return LicenseResult<MemberLicenseDto>.Fail(license.Status == LicenseStatus.Revoked ? LicenseErrors.LicenseRevoked : LicenseErrors.LicenseSuspended, "授權目前無法使用，請聯絡客服", 403);

        var (display, normalized) = LicenseKeyGenerator.Generate();
        license.LicenseKeyHash = LicenseCrypto.Sha256Hex(normalized);
        license.LicenseKeyHint = LicenseKeyGenerator.Mask(normalized);
        license.UpdatedTime = Now;
        AddEvent(license.Id, null, Events.KeyRegenerated, $"member:{memberId}", new { key_hint = license.LicenseKeyHint }, ip);
        await Db.SaveChangesAsync(ct);

        var settings = await GetSettingsAsync(ct);
        return LicenseResult<MemberLicenseDto>.Ok(ToMemberDto(license, true, null, settings, display));
    }

    public async Task<LicenseResult<MemberLicenseDto>> DeactivateMyDeviceAsync(Guid memberId, Guid activationId, string? ip, CancellationToken ct = default)
    {
        var license = await Db.Set<License>().Include(l => l.Activations).FirstOrDefaultAsync(l => l.MemberId == memberId && l.ProductCode == ProductXr, ct);
        var activation = license?.Activations.FirstOrDefault(a => a.Id == activationId);
        if (license == null || activation == null)
            return LicenseResult<MemberLicenseDto>.Fail(LicenseErrors.DeviceNotAllowed, "找不到這台裝置", 404);

        if (activation.Status == ActivationStatus.Active)
        {
            activation.Status = ActivationStatus.Deactivated;
            activation.UpdatedTime = Now;
            AddEvent(license.Id, activation.Id, Events.Deactivated, $"member:{memberId}", new { device = activation.DeviceName }, ip);
            await Db.SaveChangesAsync(ct);
        }

        var (member, company) = await LoadMemberAsync(memberId, ct);
        var (eligible, reason) = EvaluateEligibility(member, company);
        return LicenseResult<MemberLicenseDto>.Ok(ToMemberDto(license, eligible, reason, await GetSettingsAsync(ct), null));
    }

    private MemberLicenseDto ToMemberDto(License? license, bool eligible, string? reason, LicenseSettingsDto settings, string? newKey)
    {
        var dto = new MemberLicenseDto { Eligible = eligible, IneligibleReason = eligible ? null : reason, LeaseDays = settings.LeaseDays, Seats = settings.DefaultSeats, NewKey = newKey };
        if (license == null) return dto;

        dto.HasLicense = true;
        dto.Status = StatusText(license, Now);
        dto.KeyHint = license.LicenseKeyHint;
        dto.Seats = license.SeatsOverride ?? settings.DefaultSeats;
        dto.ValidUntil = license.ValidUntil;
        dto.LeaseDays = license.LeaseDaysOverride ?? settings.LeaseDays;
        dto.ActiveDevices = license.Activations.Count(a => a.Status == ActivationStatus.Active);
        dto.Devices = license.Activations
            .OrderByDescending(a => a.LastSeenAt)
            .Select(a => new MemberLicenseDeviceDto
            {
                Id = a.Id, DeviceName = a.DeviceName, Status = a.Status.ToString().ToLowerInvariant(),
                FirstActivatedAt = a.FirstActivatedAt, LastSeenAt = a.LastSeenAt, LeaseUntil = a.LeaseUntil,
            }).ToList();
        return dto;
    }

    // =====================================================================================
    // 後台：授權
    // =====================================================================================

    public async Task<(List<AdminLicenseListItemDto> Items, int TotalCount)> ListAsync(AdminLicenseQuery query, CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var licenses = Db.Set<License>().AsNoTracking().Where(l => l.ProductCode == ProductXr);

        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<LicenseStatus>(query.Status, true, out var status))
            licenses = licenses.Where(l => l.Status == status);

        var search = query.Search?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search))
        {
            var memberIds = Db.Set<Member>().AsNoTracking()
                .Where(m => m.Email.ToLower().Contains(search) || m.Number.ToLower().Contains(search)
                            || (m.Person != null && m.Person.Name != null && m.Person.Name.ToLower().Contains(search))
                            || (m.CompanyName != null && m.CompanyName.ToLower().Contains(search))
                            || (m.Company != null && m.Company.Name.ToLower().Contains(search)))
                .Select(m => m.Id);
            licenses = licenses.Where(l => memberIds.Contains(l.MemberId) || l.LicenseKeyHint.ToLower().Contains(search));
        }

        var total = await licenses.CountAsync(ct);
        var rows = await licenses.OrderByDescending(l => l.CreatedTime).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        var items = await BuildListItemsAsync(rows, ct);
        return (items, total);
    }

    private async Task<List<AdminLicenseListItemDto>> BuildListItemsAsync(List<License> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new List<AdminLicenseListItemDto>();
        var settings = await GetSettingsAsync(ct);
        var ids = rows.Select(r => r.Id).ToList();
        var memberIds = rows.Select(r => r.MemberId).Distinct().ToList();

        var members = await Db.Set<Member>().AsNoTracking().Include(m => m.Person).Include(m => m.Company)
            .Where(m => memberIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, ct);
        var stats = await Db.Set<LicenseActivation>().AsNoTracking()
            .Where(a => ids.Contains(a.LicenseId))
            .GroupBy(a => a.LicenseId)
            .Select(g => new { Id = g.Key, Active = g.Count(a => a.Status == ActivationStatus.Active), LastSeen = g.Max(a => (DateTime?)a.LastSeenAt) })
            .ToDictionaryAsync(g => g.Id, ct);

        var now = Now;
        return rows.Select(r =>
        {
            members.TryGetValue(r.MemberId, out var m);
            stats.TryGetValue(r.Id, out var st);
            return new AdminLicenseListItemDto
            {
                Id = r.Id, KeyHint = r.LicenseKeyHint, MemberId = r.MemberId,
                MemberName = m?.Person?.Name ?? m?.Nickname ?? string.Empty, MemberEmail = m?.Email ?? string.Empty,
                CompanyName = m?.Company?.Name ?? m?.CompanyName,
                Status = StatusText(r, now), Seats = r.SeatsOverride ?? settings.DefaultSeats, SeatsOverridden = r.SeatsOverride.HasValue,
                ActiveDevices = st?.Active ?? 0, ValidUntil = r.ValidUntil, LastSeenAt = st?.LastSeen, CreatedTime = r.CreatedTime,
            };
        }).ToList();
    }

    public async Task<AdminLicenseStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var byStatus = await Db.Set<License>().AsNoTracking().Where(l => l.ProductCode == ProductXr)
            .GroupBy(l => l.Status).Select(g => new { g.Key, Count = g.Count() }).ToListAsync(ct);
        int Count(LicenseStatus s) => byStatus.FirstOrDefault(x => x.Key == s)?.Count ?? 0;
        return new AdminLicenseStatsDto
        {
            Total = byStatus.Sum(x => x.Count), Active = Count(LicenseStatus.Active), Suspended = Count(LicenseStatus.Suspended), Revoked = Count(LicenseStatus.Revoked),
            ActiveDevices = await Db.Set<LicenseActivation>().AsNoTracking().CountAsync(a => a.Status == ActivationStatus.Active, ct),
        };
    }

    public async Task<AdminLicenseDetailDto?> GetDetailAsync(Guid licenseId, CancellationToken ct = default)
    {
        var license = await Db.Set<License>().AsNoTracking().Include(l => l.Activations).FirstOrDefaultAsync(l => l.Id == licenseId && l.ProductCode == ProductXr, ct);
        if (license == null) return null;

        var settings = await GetSettingsAsync(ct);
        var item = (await BuildListItemsAsync(new List<License> { license }, ct))[0];
        var (member, company) = await LoadMemberAsync(license.MemberId, ct);
        var (eligible, reason) = EvaluateEligibility(member, company);

        return new AdminLicenseDetailDto
        {
            Id = item.Id, KeyHint = item.KeyHint, MemberId = item.MemberId, MemberName = item.MemberName, MemberEmail = item.MemberEmail,
            CompanyName = item.CompanyName, Status = item.Status, Seats = item.Seats, SeatsOverridden = item.SeatsOverridden,
            ActiveDevices = item.ActiveDevices, ValidUntil = item.ValidUntil, LastSeenAt = item.LastSeenAt, CreatedTime = item.CreatedTime,
            SeatsOverride = license.SeatsOverride, DefaultSeats = settings.DefaultSeats,
            LeaseDaysOverride = license.LeaseDaysOverride, LeaseDays = license.LeaseDaysOverride ?? settings.LeaseDays,
            Notes = license.Notes, MemberEligible = eligible, IneligibleReason = eligible ? null : reason,
            Devices = license.Activations.OrderByDescending(a => a.LastSeenAt).Select(a => new AdminLicenseDeviceDto
            {
                Id = a.Id, DeviceName = a.DeviceName, Status = a.Status.ToString().ToLowerInvariant(),
                FirstActivatedAt = a.FirstActivatedAt, LastSeenAt = a.LastSeenAt, LeaseUntil = a.LeaseUntil,
                DeviceHashPreview = a.DeviceHash.Length > 16 ? a.DeviceHash[..16] + "…" : a.DeviceHash,
                LastIp = a.LastIp, ClientVersion = a.ClientVersion, ActivationMode = a.ActivationMode,
            }).ToList(),
        };
    }

    public async Task<(List<AdminLicenseEventDto> Items, int TotalCount)> ListEventsAsync(Guid licenseId, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = Db.Set<LicenseEvent>().AsNoTracking().Where(e => e.LicenseId == licenseId);
        var total = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(e => e.CreatedTime).ThenByDescending(e => e.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (rows.Select(e => new AdminLicenseEventDto { Id = e.Id, EventType = e.EventType, Actor = e.Actor, Detail = e.Detail, Ip = e.Ip, At = e.CreatedTime, ActivationId = e.ActivationId }).ToList(), total);
    }

    public async Task<LicenseResult<AdminLicenseDetailDto>> AdminUpdateAsync(Guid licenseId, AdminUpdateLicenseRequest request, string actor, string? ip, CancellationToken ct = default)
    {
        var license = await Db.Set<License>().FirstOrDefaultAsync(l => l.Id == licenseId && l.ProductCode == ProductXr, ct);
        if (license == null) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "找不到授權", 404);

        var changes = new Dictionary<string, object?>();
        if (request.SeatsOverride.HasValue)
        {
            var v = request.SeatsOverride.Value;
            if (v is < 0 or > 100) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "席次必須在 1 到 100 之間（0＝改用預設值）", 400);
            var newValue = v == 0 ? (int?)null : v;
            if (newValue != license.SeatsOverride) { changes["seats_override"] = new { from = license.SeatsOverride, to = newValue }; license.SeatsOverride = newValue; }
        }
        if (request.LeaseDaysOverride.HasValue)
        {
            var v = request.LeaseDaysOverride.Value;
            if (v is < 0 or > 365) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "租約天數必須在 1 到 365 之間（0＝改用預設值）", 400);
            var newValue = v == 0 ? (int?)null : v;
            if (newValue != license.LeaseDaysOverride) { changes["lease_days_override"] = new { from = license.LeaseDaysOverride, to = newValue }; license.LeaseDaysOverride = newValue; }
        }
        if (request.ClearValidUntil)
        {
            if (license.ValidUntil != null) changes["valid_until"] = new { from = license.ValidUntil, to = (DateTime?)null };
            license.ValidUntil = null;
        }
        else if (request.ValidUntil.HasValue)
        {
            var utc = DateTime.SpecifyKind(request.ValidUntil.Value, request.ValidUntil.Value.Kind == DateTimeKind.Unspecified ? DateTimeKind.Utc : request.ValidUntil.Value.Kind).ToUniversalTime();
            if (utc != license.ValidUntil) { changes["valid_until"] = new { from = license.ValidUntil, to = utc }; license.ValidUntil = utc; }
        }
        if (request.Notes != null)
        {
            var notes = request.Notes.Trim();
            if (notes.Length > 1000) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "備註不可超過 1000 字", 400);
            if ((notes.Length == 0 ? null : notes) != license.Notes) { changes["notes"] = true; license.Notes = notes.Length == 0 ? null : notes; }
        }

        if (changes.Count > 0)
        {
            license.UpdatedTime = Now;
            AddEvent(license.Id, null, changes.ContainsKey("seats_override") ? Events.SeatsChanged : Events.Extended, actor, changes, ip);
            await Db.SaveChangesAsync(ct);
        }
        return LicenseResult<AdminLicenseDetailDto>.Ok((await GetDetailAsync(licenseId, ct))!);
    }

    public async Task<LicenseResult<AdminLicenseDetailDto>> AdminSetStatusAsync(Guid licenseId, AdminLicenseStatusRequest request, string actor, string? ip, CancellationToken ct = default)
    {
        var license = await Db.Set<License>().Include(l => l.Activations).FirstOrDefaultAsync(l => l.Id == licenseId && l.ProductCode == ProductXr, ct);
        if (license == null) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "找不到授權", 404);

        var reason = request.Reason?.Trim();
        if (reason is { Length: > 500 }) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "原因不可超過 500 字", 400);

        string eventType;
        switch (request.Action?.ToLowerInvariant())
        {
            case "suspend":
                if (license.Status != LicenseStatus.Active) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "只有使用中的授權可以暫停", 409);
                license.Status = LicenseStatus.Suspended; eventType = Events.Suspended; break;
            case "restore":
                if (license.Status != LicenseStatus.Suspended) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "只有暫停中的授權可以恢復（已撤銷的授權不能恢復）", 409);
                license.Status = LicenseStatus.Active; eventType = Events.Restored; break;
            case "revoke":
                if (license.Status == LicenseStatus.Revoked) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "授權已經撤銷", 409);
                if (string.IsNullOrEmpty(reason)) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "撤銷授權必須填寫原因", 400);
                license.Status = LicenseStatus.Revoked; eventType = Events.Revoked;
                foreach (var a in license.Activations.Where(a => a.Status == ActivationStatus.Active)) { a.Status = ActivationStatus.Revoked; a.UpdatedTime = Now; }
                break;
            default:
                return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "不支援的動作（suspend／restore／revoke）", 400);
        }

        license.UpdatedTime = Now;
        if (!string.IsNullOrEmpty(reason)) license.Notes = reason;
        AddEvent(license.Id, null, eventType, actor, new { reason }, ip);
        await Db.SaveChangesAsync(ct);
        return LicenseResult<AdminLicenseDetailDto>.Ok((await GetDetailAsync(licenseId, ct))!);
    }

    public async Task<LicenseResult<AdminLicenseDetailDto>> AdminRevokeDeviceAsync(Guid licenseId, Guid activationId, string actor, string? ip, CancellationToken ct = default)
    {
        var activation = await Db.Set<LicenseActivation>().FirstOrDefaultAsync(a => a.Id == activationId && a.LicenseId == licenseId, ct);
        if (activation == null) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.DeviceNotAllowed, "找不到這台裝置", 404);
        if (activation.Status != ActivationStatus.Revoked)
        {
            activation.Status = ActivationStatus.Revoked;
            activation.UpdatedTime = Now;
            AddEvent(licenseId, activation.Id, Events.DeviceRevoked, actor, new { device = activation.DeviceName }, ip);
            await Db.SaveChangesAsync(ct);
        }
        return LicenseResult<AdminLicenseDetailDto>.Ok((await GetDetailAsync(licenseId, ct))!);
    }

    public async Task<LicenseResult<AdminLicenseDetailDto>> AdminInvalidateKeyAsync(Guid licenseId, string actor, string? ip, CancellationToken ct = default)
    {
        var license = await Db.Set<License>().FirstOrDefaultAsync(l => l.Id == licenseId && l.ProductCode == ProductXr, ct);
        if (license == null) return LicenseResult<AdminLicenseDetailDto>.Fail(LicenseErrors.InvalidRequest, "找不到授權", 404);

        // 換成一個沒有人知道的隨機雜湊：舊序號立即不能再啟用；會員要到會員中心自己重新產生新序號
        license.LicenseKeyHash = LicenseCrypto.Sha256Hex(Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"));
        license.LicenseKeyHint = "（已作廢，請會員重新產生）";
        license.UpdatedTime = Now;
        AddEvent(license.Id, null, Events.KeyRegenerated, actor, new { invalidated_by_admin = true }, ip);
        await Db.SaveChangesAsync(ct);
        return LicenseResult<AdminLicenseDetailDto>.Ok((await GetDetailAsync(licenseId, ct))!);
    }

    // =====================================================================================
    // 後台：簽章金鑰與設定
    // =====================================================================================

    public async Task<List<AdminSigningKeyDto>> ListSigningKeysAsync(CancellationToken ct = default)
    {
        var keys = await Db.Set<LicenseSigningKey>().AsNoTracking().OrderBy(k => k.CreatedTime).ToListAsync(ct);
        return keys.Select(ToKeyDto).ToList();
    }

    private static AdminSigningKeyDto ToKeyDto(LicenseSigningKey k) => new()
    {
        Kid = k.Kid, KmsKeyVersion = k.KmsKeyVersion, PublicKey = k.PublicKey, Status = k.Status.ToString().ToLowerInvariant(),
        NotAfter = k.NotAfter, Notes = k.Notes, CreatedTime = k.CreatedTime,
    };

    public async Task<LicenseResult<AdminSigningKeyDto>> RegisterSigningKeyAsync(RegisterSigningKeyRequest request, string actor, string? ip, CancellationToken ct = default)
    {
        var kid = request.Kid?.Trim() ?? string.Empty;
        var version = request.KmsKeyVersion?.Trim() ?? string.Empty;
        if (!KidPattern.IsMatch(kid)) return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "金鑰編號（kid）只能用小寫英數字、點、底線、連字號，長度 2 到 59（例如 prod-2026-10）", 400);
        if (!KmsVersionPattern.IsMatch(version)) return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "KMS 金鑰版本格式不正確，應為 projects/…/locations/…/keyRings/…/cryptoKeys/…/cryptoKeyVersions/N", 400);
        if (request.Notes is { Length: > 500 }) return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "備註不可超過 500 字", 400);
        if (await Db.Set<LicenseSigningKey>().AnyAsync(k => k.Kid == kid || k.KmsKeyVersion == version, ct))
            return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "這個 kid 或 KMS 金鑰版本已經登錄過", 409);

        // 向 KMS 取公鑰（同時檢查演算法），再實際簽一次並用公鑰驗證，確認後端有簽章權限、公鑰與金鑰一致
        string publicKey;
        try
        {
            publicKey = await _signer.GetPublicKeyAsync(version, ct);
            var probe = System.Text.Encoding.UTF8.GetBytes("license-signing-key-probe:" + kid);
            var signature = await _signer.SignAsync(version, probe, ct);
            if (!LicenseCrypto.Verify(publicKey, probe, signature))
                return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "KMS 簽章無法用取回的公鑰驗證，請確認金鑰版本與演算法（EC_SIGN_P256_SHA256）", 400);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "登錄簽章金鑰失敗：{Version}", version);
            return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, $"無法使用這把 KMS 金鑰：{ex.Message}（請確認金鑰版本存在、演算法是 EC_SIGN_P256_SHA256，且後端的服務帳號有簽章與讀取公鑰的權限）", 400);
        }

        // 第一把金鑰自動成為 Active；之後登錄的先是待命（公鑰先公開讓廠商內嵌），要切換簽發時再設成 Active
        var hasActive = await Db.Set<LicenseSigningKey>().AnyAsync(k => k.Status == SigningKeyStatus.Active, ct);
        var key = new LicenseSigningKey
        {
            Kid = kid, KmsKeyVersion = version, PublicKey = publicKey,
            Status = hasActive ? SigningKeyStatus.Standby : SigningKeyStatus.Active,
            NotAfter = request.NotAfter?.ToUniversalTime(), Notes = request.Notes?.Trim(),
            CreatedTime = Now, UpdatedTime = Now,
        };
        Db.Set<LicenseSigningKey>().Add(key);
        AddEvent(null, null, Events.KeyRegistered, actor, new { kid, status = key.Status.ToString().ToLowerInvariant() }, ip);
        await Db.SaveChangesAsync(ct);
        return LicenseResult<AdminSigningKeyDto>.Ok(ToKeyDto(key));
    }

    public async Task<LicenseResult<AdminSigningKeyDto>> UpdateSigningKeyAsync(string kid, UpdateSigningKeyRequest request, string actor, string? ip, CancellationToken ct = default)
    {
        var key = await Db.Set<LicenseSigningKey>().FirstOrDefaultAsync(k => k.Kid == kid, ct);
        if (key == null) return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "找不到這把金鑰", 404);
        if (request.Notes is { Length: > 500 }) return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "備註不可超過 500 字", 400);

        var detail = new Dictionary<string, object?> { ["kid"] = kid };
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!Enum.TryParse<SigningKeyStatus>(request.Status, true, out var newStatus))
                return LicenseResult<AdminSigningKeyDto>.Fail(LicenseErrors.InvalidRequest, "狀態必須是 active／standby／retiring／retired", 400);
            if (newStatus != key.Status)
            {
                if (newStatus == SigningKeyStatus.Active)
                {
                    // 同一時間只有一把 Active：原本的改成退役中（公鑰仍公開，已簽發的授權在租約期間還能驗證）
                    foreach (var other in await Db.Set<LicenseSigningKey>().Where(k => k.Status == SigningKeyStatus.Active && k.Kid != kid).ToListAsync(ct))
                    {
                        other.Status = SigningKeyStatus.Retiring; other.UpdatedTime = Now;
                        AddEvent(null, null, Events.KeyStatusChanged, actor, new { kid = other.Kid, from = "active", to = "retiring", reason = "新的 active 金鑰上線" }, ip);
                    }
                }
                detail["from"] = key.Status.ToString().ToLowerInvariant();
                detail["to"] = newStatus.ToString().ToLowerInvariant();
                key.Status = newStatus;
            }
        }
        if (request.ClearNotAfter) key.NotAfter = null;
        else if (request.NotAfter.HasValue) key.NotAfter = request.NotAfter.Value.ToUniversalTime();
        if (request.Notes != null) key.Notes = request.Notes.Trim();
        key.UpdatedTime = Now;

        AddEvent(null, null, Events.KeyStatusChanged, actor, detail, ip);
        await Db.SaveChangesAsync(ct);
        return LicenseResult<AdminSigningKeyDto>.Ok(ToKeyDto(key));
    }

    public async Task<LicenseResult<LicenseSettingsDto>> UpdateSettingsAsync(LicenseSettingsDto settings, string actor, string? ip, CancellationToken ct = default)
    {
        var error = LicenseSettingsDto.Validate(settings);
        if (error != null) return LicenseResult<LicenseSettingsDto>.Fail(LicenseErrors.InvalidRequest, error, 400);

        var before = await GetSettingsAsync(ct);
        var result = await _settingService.UpdateSettingAsync(SettingsCategory, new LicenseSettingsDto { DefaultSeats = settings.DefaultSeats, LeaseDays = settings.LeaseDays });
        if (!result.IsSuccess) return LicenseResult<LicenseSettingsDto>.Fail(LicenseErrors.ServiceUnavailable, result.Error ?? "儲存失敗", 500);

        AddEvent(null, null, Events.SettingsChanged, actor, new { default_seats = new { from = before.DefaultSeats, to = settings.DefaultSeats }, lease_days = new { from = before.LeaseDays, to = settings.LeaseDays } }, ip);
        await Db.SaveChangesAsync(ct);
        return LicenseResult<LicenseSettingsDto>.Ok(settings);
    }
}
