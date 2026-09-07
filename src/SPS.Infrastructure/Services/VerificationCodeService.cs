using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Auth;
using SPS.Application.Interfaces.IServices;
using StackExchange.Redis;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 驗證碼服務實現（使用 Redis 存儲）
/// </summary>
public class VerificationCodeService : IVerificationCodeService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IEmailService _emailService;
    private readonly ILogger<VerificationCodeService> _logger;

    // 驗證碼配置
    private const int CodeLength = 6;
    private const int ExpirationMinutes = 5;
    private const int MaxAttempts = 5;
    private const int CooldownSeconds = 60;

    public VerificationCodeService(
        IConnectionMultiplexer redis,
        IEmailService emailService,
        ILogger<VerificationCodeService> logger)
    {
        _redis = redis;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    public async Task<Result> SendCodeAsync(
        string email,
        string userName,
        VerificationCodePurpose purpose,
        CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var cooldownKey = GetCooldownKey(email, purpose);

        // 檢查冷卻期
        if (await db.KeyExistsAsync(cooldownKey))
        {
            var ttl = await db.KeyTimeToLiveAsync(cooldownKey);
            return Result.Failure($"請等待 {ttl?.Seconds ?? CooldownSeconds} 秒後再試");
        }

        // 生成 6 位數字驗證碼
        var code = GenerateCode();
        var codeKey = GetCodeKey(email, purpose);

        // 存儲驗證碼資訊
        var codeData = new VerificationCodeData
        {
            Code = code,
            Attempts = 0,
            CreatedAt = DateTime.UtcNow
        };

        await db.StringSetAsync(
            codeKey,
            JsonSerializer.Serialize(codeData),
            TimeSpan.FromMinutes(ExpirationMinutes));

        // 設置冷卻期
        await db.StringSetAsync(cooldownKey, "1", TimeSpan.FromSeconds(CooldownSeconds));

        // 發送郵件
        try
        {
            await _emailService.SendVerificationEmailCodeAsync(email, code);
            _logger.LogInformation("Verification code sent to {Email} for purpose {Purpose}", email, purpose);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification code to {Email}", email);
            // 發送失敗時，清除已存儲的驗證碼和冷卻期
            await db.KeyDeleteAsync(codeKey);
            await db.KeyDeleteAsync(cooldownKey);
            return Result.Failure("發送驗證碼失敗，請稍後再試");
        }
    }

    /// <summary>
    /// 驗證驗證碼
    /// </summary>
    public async Task<Result<bool>> VerifyCodeAsync(
        string email,
        string code,
        VerificationCodePurpose purpose,
        CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var codeKey = GetCodeKey(email, purpose);

        // 獲取存儲的驗證碼資訊
        var storedDataJson = await db.StringGetAsync(codeKey);
        if (storedDataJson.IsNullOrEmpty)
        {
            return Result<bool>.Failure("驗證碼已過期或不存在");
        }

        var codeData = JsonSerializer.Deserialize<VerificationCodeData>(storedDataJson!.ToString());
        if (codeData == null)
        {
            return Result<bool>.Failure("驗證碼資料錯誤");
        }

        // 檢查嘗試次數
        if (codeData.Attempts >= MaxAttempts)
        {
            await db.KeyDeleteAsync(codeKey);
            return Result<bool>.Failure("驗證碼已失效，請重新獲取");
        }

        // 驗證
        if (codeData.Code != code)
        {
            // 增加嘗試次數
            codeData.Attempts++;
            var ttl = await db.KeyTimeToLiveAsync(codeKey);
            if (ttl.HasValue)
            {
                await db.StringSetAsync(codeKey, JsonSerializer.Serialize(codeData), ttl.Value);
            }

            var remainingAttempts = MaxAttempts - codeData.Attempts;
            return Result<bool>.Failure($"驗證碼錯誤，剩餘 {remainingAttempts} 次嘗試機會");
        }

        _logger.LogInformation("Verification code verified successfully for {Email}, purpose {Purpose}", email, purpose);
        return Result<bool>.Success(true);
    }

    /// <summary>
    /// 使驗證碼失效
    /// </summary>
    public async Task InvalidateCodeAsync(
        string email,
        VerificationCodePurpose purpose,
        CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var codeKey = GetCodeKey(email, purpose);
        await db.KeyDeleteAsync(codeKey);
        _logger.LogInformation("Verification code invalidated for {Email}, purpose {Purpose}", email, purpose);
    }

    /// <summary>
    /// 生成隨機驗證碼
    /// </summary>
    private static string GenerateCode()
    {
        var bytes = new byte[4];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        var number = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;
        return number.ToString("D6");
    }

    /// <summary>
    /// 獲取驗證碼 Redis Key
    /// </summary>
    private static string GetCodeKey(string email, VerificationCodePurpose purpose)
    {
        return $"verification_code:{purpose}:{email.ToLowerInvariant()}";
    }

    /// <summary>
    /// 獲取冷卻期 Redis Key
    /// </summary>
    private static string GetCooldownKey(string email, VerificationCodePurpose purpose)
    {
        return $"verification_code:cooldown:{email.ToLowerInvariant()}:{purpose}";
    }

    /// <summary>
    /// 驗證碼資料結構
    /// </summary>
    private class VerificationCodeData
    {
        public string Code { get; set; } = string.Empty;
        public int Attempts { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
