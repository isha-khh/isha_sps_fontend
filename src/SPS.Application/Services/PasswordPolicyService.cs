using System.Security.Cryptography;
using System.Text.RegularExpressions;
using SPS.Application.Common;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>
/// 密碼策略驗證服務實現
/// </summary>
public class PasswordPolicyService : IPasswordPolicyService
{
    /// <summary>
    /// 歷史紀錄至少保留幾筆（即使後台目前設 0 或很小，也留著，之後調高「不可重複前 N 組」才有資料可比對）。
    /// </summary>
    private const int MinRetained = 10;

    private readonly ISystemSettingService _systemSettingService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public PasswordPolicyService(
        ISystemSettingService systemSettingService,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher)
    {
        _systemSettingService = systemSettingService;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    private async Task<PasswordPolicyDto> GetPolicyAsync(CancellationToken cancellationToken)
    {
        var result = await _systemSettingService.GetSettingAsync<PasswordPolicyDto>("PasswordPolicy", cancellationToken);
        return result.Data ?? new PasswordPolicyDto();
    }

    public async Task<Result> ValidatePasswordAsync(string password, CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);
        return ValidateComposition(password, policy);
    }

    public async Task<Result> ValidateForMemberAsync(string password, Guid memberId, CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);
        var composition = ValidateComposition(password, policy);
        if (!composition.IsSuccess || policy.PasswordHistoryCount <= 0) return composition;

        var member = await _unitOfWork.Members.GetByIdAsync(memberId, cancellationToken);
        var recent = await _unitOfWork.PasswordHistories.GetRecentByMemberAsync(memberId, policy.PasswordHistoryCount, cancellationToken);
        return CheckHistory(password, member?.Password, recent, policy.PasswordHistoryCount);
    }

    public async Task<Result> ValidateForUserAsync(string password, Guid userId, CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);
        var composition = ValidateComposition(password, policy);
        if (!composition.IsSuccess || policy.PasswordHistoryCount <= 0) return composition;

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        var recent = await _unitOfWork.PasswordHistories.GetRecentByUserAsync(userId, policy.PasswordHistoryCount, cancellationToken);
        return CheckHistory(password, user?.Password, recent, policy.PasswordHistoryCount);
    }

    public async Task RecordForMemberAsync(Guid memberId, string passwordHash, CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);
        var retain = Math.Max(policy.PasswordHistoryCount, MinRetained);

        await _unitOfWork.PasswordHistories.AddAsync(new PasswordHistory
        {
            Id = Guid.NewGuid(),
            MemberId = memberId,
            PasswordHash = passwordHash,
        }, cancellationToken);

        // 新的這筆還沒存進資料庫，所以資料庫裡最多留 retain - 1 筆舊的，其餘刪掉
        var existing = await _unitOfWork.PasswordHistories.GetRecentByMemberAsync(memberId, retain + 50, cancellationToken);
        foreach (var stale in existing.Skip(retain - 1)) _unitOfWork.PasswordHistories.Remove(stale);
    }

    public async Task RecordForUserAsync(Guid userId, string passwordHash, CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);
        var retain = Math.Max(policy.PasswordHistoryCount, MinRetained);

        await _unitOfWork.PasswordHistories.AddAsync(new PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = passwordHash,
        }, cancellationToken);

        var existing = await _unitOfWork.PasswordHistories.GetRecentByUserAsync(userId, retain + 50, cancellationToken);
        foreach (var stale in existing.Skip(retain - 1)) _unitOfWork.PasswordHistories.Remove(stale);
    }

    public async Task<string> GeneratePasswordAsync(CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(cancellationToken);

        // 去掉容易看錯的字元（I、O、l、0、1）；特殊字元只用密碼策略檢查認得的那幾個
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghijkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%";

        // 四種字元各至少一個（不管後台目前有沒有要求，之後調嚴也不會不合規），長度不低於策略下限
        var length = Math.Max(12, policy.MinLength);
        var chars = new List<char>
        {
            upper[RandomNumberGenerator.GetInt32(upper.Length)],
            lower[RandomNumberGenerator.GetInt32(lower.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            special[RandomNumberGenerator.GetInt32(special.Length)],
        };
        var all = upper + lower + digits + special;
        while (chars.Count < length) chars.Add(all[RandomNumberGenerator.GetInt32(all.Length)]);

        // 洗牌，避免固定「大寫開頭」
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
        return new string(chars.ToArray());
    }

    /// <summary>
    /// 新密碼不可與「最近 N 組」相同：目前密碼算第 1 組，再往前補歷史紀錄湊滿 N 組。
    /// 歷史紀錄是這個功能上線後才開始累積，所以一定要把帳號目前的密碼也一起比對，
    /// 不然剛上線時使用者可以直接把密碼「改成原本那組」。
    /// </summary>
    private Result CheckHistory(string password, string? currentHash, List<PasswordHistory> recent, int count)
    {
        var hashes = new List<string>();
        if (!string.IsNullOrEmpty(currentHash)) hashes.Add(currentHash);
        foreach (var row in recent)
        {
            if (hashes.Count >= count) break;
            if (!hashes.Contains(row.PasswordHash)) hashes.Add(row.PasswordHash);
        }

        foreach (var hash in hashes.Take(count))
        {
            if (_passwordHasher.Verify(password, hash))
            {
                return Result.Failure(count == 1
                    ? "新密碼不能與目前密碼相同"
                    : $"新密碼不可與最近使用過的 {count} 組密碼相同");
            }
        }

        return Result.Success();
    }

    private static Result ValidateComposition(string password, PasswordPolicyDto policy)
    {
        var errors = new List<string>();

        if (password.Length < policy.MinLength)
        {
            errors.Add($"密碼長度至少需要 {policy.MinLength} 個字元");
        }

        if (policy.RequireUppercase && !Regex.IsMatch(password, @"[A-Z]"))
        {
            errors.Add("密碼需包含至少一個大寫字母");
        }

        if (policy.RequireLowercase && !Regex.IsMatch(password, @"[a-z]"))
        {
            errors.Add("密碼需包含至少一個小寫字母");
        }

        if (policy.RequireDigit && !Regex.IsMatch(password, @"\d"))
        {
            errors.Add("密碼需包含至少一個數字");
        }

        if (policy.RequireSpecialCharacter && !Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?`~]"))
        {
            errors.Add("密碼需包含至少一個特殊字元");
        }

        if (errors.Count > 0)
        {
            return Result.Failure(string.Join("；", errors));
        }

        return Result.Success();
    }
}
