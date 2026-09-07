using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using SPS.Application.Common;
using SPS.Application.DTOs.Captcha;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using StackExchange.Redis;

namespace SPS.Infrastructure.Services;

/// <summary>
/// CAPTCHA 驗證碼服務實現
/// </summary>
public class CaptchaService : ICaptchaService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ISystemSettingService _settingService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly ILogger<CaptchaService> _logger;

    private const string CaptchaKeyPrefix = "captcha:";
    private const string TurnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public CaptchaService(
        IConnectionMultiplexer redis,
        ISystemSettingService settingService,
        IHttpClientFactory httpClientFactory,
        IWebHostEnvironment webHostEnvironment,
        ILogger<CaptchaService> logger)
    {
        _redis = redis;
        _settingService = settingService;
        _httpClientFactory = httpClientFactory;
        _webHostEnvironment = webHostEnvironment;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<Result<CaptchaPublicSettings>> GetPublicSettingsAsync(string scenario, CancellationToken cancellationToken = default)
    {
        var settings = await GetCaptchaSettingsAsync(cancellationToken);

        if (!settings.Enabled)
        {
            return Result<CaptchaPublicSettings>.Success(new CaptchaPublicSettings
            {
                Enabled = false,
                CaptchaType = 0
            });
        }

        // 檢查場景是否啟用
        var isEnabled = IsScenarioEnabled(settings, scenario);

        var publicSettings = new CaptchaPublicSettings
        {
            Enabled = isEnabled,
            CaptchaType = settings.CaptchaType,
            TurnstileSiteKey = settings.CaptchaType == (int)CaptchaType.Turnstile
                ? settings.Turnstile.SiteKey
                : null,
            EnableAudio = settings.ImageCaptcha.EnableAudio
        };

        return Result<CaptchaPublicSettings>.Success(publicSettings);
    }

    /// <inheritdoc />
    public async Task<Result<CaptchaGenerateResponse>> GenerateImageCaptchaAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetCaptchaSettingsAsync(cancellationToken);

        if (!settings.Enabled || settings.CaptchaType != (int)CaptchaType.ImageCode)
        {
            return Result<CaptchaGenerateResponse>.Failure("圖片驗證碼未啟用");
        }

        var codeLength = settings.ImageCaptcha.CodeLength;
        var expirationSeconds = settings.ImageCaptcha.ExpirationSeconds;

        // 生成驗證碼
        var code = GenerateCode(codeLength);
        var captchaId = Guid.NewGuid().ToString("N");

        // 生成圖片
        var imageBytes = GenerateCaptchaImage(code);
        var imageBase64 = Convert.ToBase64String(imageBytes);

        // 存儲到 Redis
        var db = _redis.GetDatabase();
        var captchaData = new CaptchaStorageData
        {
            Code = code,
            Attempts = 0,
            CreatedAt = DateTime.UtcNow
        };

        await db.StringSetAsync(
            $"{CaptchaKeyPrefix}{captchaId}",
            JsonSerializer.Serialize(captchaData),
            TimeSpan.FromSeconds(expirationSeconds));

        _logger.LogInformation("Generated image captcha: {CaptchaId}", captchaId);

        return Result<CaptchaGenerateResponse>.Success(new CaptchaGenerateResponse
        {
            CaptchaId = captchaId,
            ImageBase64 = $"data:image/png;base64,{imageBase64}",
            ExpiresInSeconds = expirationSeconds
        });
    }

    /// <inheritdoc />
    public async Task<Result<byte[]>> GetCaptchaAudioAsync(string captchaId, CancellationToken cancellationToken = default)
    {
        var settings = await GetCaptchaSettingsAsync(cancellationToken);

        if (!settings.Enabled || settings.CaptchaType != (int)CaptchaType.ImageCode)
        {
            return Result<byte[]>.Failure("音訊驗證碼未啟用");
        }

        if (!settings.ImageCaptcha.EnableAudio)
        {
            return Result<byte[]>.Failure("音訊驗證碼功能未啟用");
        }

        var db = _redis.GetDatabase();
        var storedDataJson = await db.StringGetAsync($"{CaptchaKeyPrefix}{captchaId}");

        if (storedDataJson.IsNullOrEmpty)
        {
            return Result<byte[]>.Failure("驗證碼不存在或已過期");
        }

        var captchaData = JsonSerializer.Deserialize<CaptchaStorageData>(storedDataJson!.ToString());
        if (captchaData == null)
        {
            return Result<byte[]>.Failure("驗證碼資料錯誤");
        }

        // 生成音訊
        var audioBytes = GenerateCaptchaAudio(captchaData.Code);

        return Result<byte[]>.Success(audioBytes);
    }

    /// <inheritdoc />
    public async Task<Result<bool>> VerifyCaptchaAsync(CaptchaVerifyRequest request, string? remoteIp, CancellationToken cancellationToken = default)
    {
        var settings = await GetCaptchaSettingsAsync(cancellationToken);

        if (!settings.Enabled)
        {
            return Result<bool>.Success(true);
        }

        return request.Type switch
        {
            CaptchaType.Turnstile => await VerifyTurnstileAsync(request.TurnstileToken, remoteIp, settings, cancellationToken),
            CaptchaType.ImageCode => await VerifyImageCaptchaAsync(request.CaptchaId, request.Code, settings, cancellationToken),
            _ => Result<bool>.Success(true)
        };
    }

    /// <inheritdoc />
    public async Task<Result<bool>> VerifyCaptchaAsync(CaptchaData? captcha, string? remoteIp, CancellationToken cancellationToken = default)
    {
        if (captcha == null)
        {
            var settings = await GetCaptchaSettingsAsync(cancellationToken);
            if (!settings.Enabled)
            {
                return Result<bool>.Success(true);
            }
            return Result<bool>.Failure("驗證碼資料為空");
        }

        var request = new CaptchaVerifyRequest
        {
            Type = captcha.Type,
            CaptchaId = captcha.CaptchaId,
            Code = captcha.Code,
            TurnstileToken = captcha.TurnstileToken
        };

        return await VerifyCaptchaAsync(request, remoteIp, cancellationToken);
    }

    /// <inheritdoc />
    public async Task InvalidateCaptchaAsync(string captchaId, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        await db.KeyDeleteAsync($"{CaptchaKeyPrefix}{captchaId}");
        _logger.LogInformation("Captcha invalidated: {CaptchaId}", captchaId);
    }

    /// <inheritdoc />
    public async Task<bool> IsScenarioEnabledAsync(string scenario, CancellationToken cancellationToken = default)
    {
        var settings = await GetCaptchaSettingsAsync(cancellationToken);
        return settings.Enabled && IsScenarioEnabled(settings, scenario);
    }

    #region Private Methods

    private async Task<CaptchaSettingsDto> GetCaptchaSettingsAsync(CancellationToken cancellationToken)
    {
        var result = await _settingService.GetSettingAsync<CaptchaSettingsDto>("Captcha");
        return result.IsSuccess && result.Data != null ? result.Data : new CaptchaSettingsDto();
    }

    private static bool IsScenarioEnabled(CaptchaSettingsDto settings, string scenario)
    {
        return scenario.ToLowerInvariant() switch
        {
            "member-login" => settings.Scenarios.MemberLogin,
            "member-register" => settings.Scenarios.MemberRegister,
            "admin-login" => settings.Scenarios.AdminLogin,
            "forgot-password" => settings.Scenarios.ForgotPassword,
            _ => false
        };
    }

    private async Task<Result<bool>> VerifyTurnstileAsync(
        string? token,
        string? remoteIp,
        CaptchaSettingsDto settings,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(token))
        {
            return Result<bool>.Failure("Turnstile token 不能為空");
        }

        if (string.IsNullOrEmpty(settings.Turnstile.SecretKey))
        {
            _logger.LogWarning("Turnstile secret key is not configured");
            return Result<bool>.Failure("Turnstile 未正確配置");
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            var requestData = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", settings.Turnstile.SecretKey),
                new KeyValuePair<string, string>("response", token),
                new KeyValuePair<string, string>("remoteip", remoteIp ?? string.Empty)
            });

            var response = await client.PostAsync(TurnstileVerifyUrl, requestData, cancellationToken);
            var result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>(cancellationToken: cancellationToken);

            if (result?.Success == true)
            {
                _logger.LogInformation("Turnstile verification successful");
                return Result<bool>.Success(true);
            }

            var errorCodes = result?.ErrorCodes != null ? string.Join(", ", result.ErrorCodes) : "unknown";
            _logger.LogWarning("Turnstile verification failed: {ErrorCodes}", errorCodes);
            return Result<bool>.Failure("Turnstile 驗證失敗");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Turnstile token");
            return Result<bool>.Failure("Turnstile 驗證過程發生錯誤");
        }
    }

    private async Task<Result<bool>> VerifyImageCaptchaAsync(
        string? captchaId,
        string? code,
        CaptchaSettingsDto settings,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(captchaId) || string.IsNullOrEmpty(code))
        {
            return Result<bool>.Failure("驗證碼 ID 和驗證碼不能為空");
        }

        var db = _redis.GetDatabase();
        var key = $"{CaptchaKeyPrefix}{captchaId}";
        var storedDataJson = await db.StringGetAsync(key);

        if (storedDataJson.IsNullOrEmpty)
        {
            return Result<bool>.Failure("驗證碼已過期或不存在");
        }

        var captchaData = JsonSerializer.Deserialize<CaptchaStorageData>(storedDataJson!.ToString());
        if (captchaData == null)
        {
            return Result<bool>.Failure("驗證碼資料錯誤");
        }

        // 檢查嘗試次數
        if (captchaData.Attempts >= settings.ImageCaptcha.MaxAttempts)
        {
            await db.KeyDeleteAsync(key);
            return Result<bool>.Failure("驗證碼已失效，請重新獲取");
        }

        // 驗證（不區分大小寫）
        if (!string.Equals(captchaData.Code, code, StringComparison.OrdinalIgnoreCase))
        {
            // 增加嘗試次數
            captchaData.Attempts++;
            var ttl = await db.KeyTimeToLiveAsync(key);
            if (ttl.HasValue)
            {
                await db.StringSetAsync(key, JsonSerializer.Serialize(captchaData), ttl.Value);
            }

            var remainingAttempts = settings.ImageCaptcha.MaxAttempts - captchaData.Attempts;
            return Result<bool>.Failure($"驗證碼錯誤，剩餘 {remainingAttempts} 次嘗試機會");
        }

        // 驗證成功，刪除驗證碼
        await db.KeyDeleteAsync(key);
        _logger.LogInformation("Image captcha verified successfully: {CaptchaId}", captchaId);

        return Result<bool>.Success(true);
    }

    private static string GenerateCode(int length)
    {
        const string chars = "0123456789";
        var bytes = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);

        var result = new StringBuilder(length);
        foreach (var b in bytes)
        {
            result.Append(chars[b % chars.Length]);
        }

        return result.ToString();
    }

    private static byte[] GenerateCaptchaImage(string code)
    {
        const int width = 150;
        const int height = 50;

        using var surface = SKSurface.Create(new SKImageInfo(width, height));
        var canvas = surface.Canvas;

        // 背景
        canvas.Clear(SKColors.White);

        // 添加噪點
        using var noisePaint = new SKPaint
        {
            Color = SKColors.LightGray,
            StrokeWidth = 1
        };

        var random = new Random();
        for (int i = 0; i < 100; i++)
        {
            canvas.DrawPoint(random.Next(width), random.Next(height), noisePaint);
        }

        // 添加干擾線
        using var linePaint = new SKPaint
        {
            Color = SKColors.LightGray,
            StrokeWidth = 1,
            Style = SKPaintStyle.Stroke
        };

        for (int i = 0; i < 5; i++)
        {
            canvas.DrawLine(
                random.Next(width), random.Next(height),
                random.Next(width), random.Next(height),
                linePaint);
        }

        // 繪製文字
        using var textPaint = new SKPaint
        {
            TextSize = 36,
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Typeface = SKTypeface.FromFamilyName("DejaVu Sans", SKFontStyle.Bold)
        };

        var colors = new[] { SKColors.Red, SKColors.Blue, SKColors.Green, SKColors.Purple, SKColors.Orange };
        float x = 15;

        foreach (var c in code)
        {
            textPaint.Color = colors[random.Next(colors.Length)];

            // 隨機傾斜
            canvas.Save();
            canvas.RotateDegrees(random.Next(-15, 15), x + 10, height / 2);

            canvas.DrawText(c.ToString(), x, height - 12, textPaint);
            canvas.Restore();

            x += 30;
        }

        // 輸出為 PNG
        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);

        return data.ToArray();
    }

    private byte[] GenerateCaptchaAudio(string code)
    {
        // 從 wwwroot/voice 讀取預錄的中文數字音檔並組合
        var voicePath = Path.Combine(_webHostEnvironment.WebRootPath, "voice");
        var audioDataList = new List<byte[]>();

        // 讀取每個數字的音檔
        foreach (var digit in code)
        {
            var filePath = Path.Combine(voicePath, $"{digit}.wav");
            if (File.Exists(filePath))
            {
                var wavData = File.ReadAllBytes(filePath);
                // 跳過 WAV header (44 bytes)，只取音訊資料
                if (wavData.Length > 44)
                {
                    var audioData = new byte[wavData.Length - 44];
                    Array.Copy(wavData, 44, audioData, 0, audioData.Length);
                    audioDataList.Add(audioData);
                }
            }
        }

        if (audioDataList.Count == 0)
        {
            _logger.LogWarning("No voice files found in {VoicePath}", voicePath);
            return GenerateFallbackAudio(code);
        }

        // 讀取第一個檔案的 header 來取得格式資訊
        var firstFilePath = Path.Combine(voicePath, $"{code[0]}.wav");
        var headerBytes = File.ReadAllBytes(firstFilePath);

        // 解析 WAV header
        using var headerReader = new BinaryReader(new MemoryStream(headerBytes));
        headerReader.ReadBytes(4); // RIFF
        headerReader.ReadInt32();  // file size
        headerReader.ReadBytes(4); // WAVE
        headerReader.ReadBytes(4); // fmt
        var fmtChunkSize = headerReader.ReadInt32();
        var audioFormat = headerReader.ReadInt16();
        var channels = headerReader.ReadInt16();
        var sampleRate = headerReader.ReadInt32();
        var byteRate = headerReader.ReadInt32();
        var blockAlign = headerReader.ReadInt16();
        var bitsPerSample = headerReader.ReadInt16();

        // 計算間隔靜音的樣本數 (0.3 秒)
        var silenceDuration = 0.3;
        var silenceSampleCount = (int)(sampleRate * silenceDuration);
        var silenceBytes = new byte[silenceSampleCount * channels * (bitsPerSample / 8)];

        // 組合所有音訊資料
        using var ms = new MemoryStream();
        using var writer = new BinaryWriter(ms);

        // 計算總資料大小
        var totalDataSize = audioDataList.Sum(a => a.Length) + (audioDataList.Count - 1) * silenceBytes.Length;

        // 寫入 RIFF header
        writer.Write(Encoding.ASCII.GetBytes("RIFF"));
        writer.Write(36 + totalDataSize);
        writer.Write(Encoding.ASCII.GetBytes("WAVE"));

        // 寫入 fmt chunk
        writer.Write(Encoding.ASCII.GetBytes("fmt "));
        writer.Write(16);
        writer.Write(audioFormat);
        writer.Write(channels);
        writer.Write(sampleRate);
        writer.Write(byteRate);
        writer.Write(blockAlign);
        writer.Write(bitsPerSample);

        // 寫入 data chunk
        writer.Write(Encoding.ASCII.GetBytes("data"));
        writer.Write(totalDataSize);

        // 寫入音訊資料，每個數字之間加入靜音間隔
        for (int i = 0; i < audioDataList.Count; i++)
        {
            writer.Write(audioDataList[i]);
            if (i < audioDataList.Count - 1)
            {
                writer.Write(silenceBytes);
            }
        }

        return ms.ToArray();
    }

    private static byte[] GenerateFallbackAudio(string code)
    {
        // 後備方案：使用簡單的正弦波
        const int sampleRate = 22050;
        const int bitsPerSample = 16;
        const int channels = 1;

        var samples = new List<short>();
        var digitFrequencies = new Dictionary<char, int[]>
        {
            { '0', new[] { 523, 659, 784 } },
            { '1', new[] { 262 } },
            { '2', new[] { 294, 330 } },
            { '3', new[] { 330, 392, 440 } },
            { '4', new[] { 349, 440 } },
            { '5', new[] { 392, 494 } },
            { '6', new[] { 440, 523 } },
            { '7', new[] { 494, 587 } },
            { '8', new[] { 523, 659 } },
            { '9', new[] { 587, 698 } }
        };

        foreach (var digit in code)
        {
            if (digitFrequencies.TryGetValue(digit, out var frequencies))
            {
                var sampleCount = (int)(sampleRate * 0.5);
                for (int i = 0; i < sampleCount; i++)
                {
                    double sample = 0;
                    foreach (var freq in frequencies)
                    {
                        sample += Math.Sin(2 * Math.PI * freq * i / sampleRate);
                    }
                    sample = sample / frequencies.Length * 16000;
                    samples.Add((short)sample);
                }

                var silenceSamples = (int)(sampleRate * 0.2);
                for (int i = 0; i < silenceSamples; i++)
                {
                    samples.Add(0);
                }
            }
        }

        using var ms = new MemoryStream();
        using var writer = new BinaryWriter(ms);

        var dataSize = samples.Count * bitsPerSample / 8;

        writer.Write(Encoding.ASCII.GetBytes("RIFF"));
        writer.Write(36 + dataSize);
        writer.Write(Encoding.ASCII.GetBytes("WAVE"));
        writer.Write(Encoding.ASCII.GetBytes("fmt "));
        writer.Write(16);
        writer.Write((short)1);
        writer.Write((short)channels);
        writer.Write(sampleRate);
        writer.Write(sampleRate * channels * bitsPerSample / 8);
        writer.Write((short)(channels * bitsPerSample / 8));
        writer.Write((short)bitsPerSample);
        writer.Write(Encoding.ASCII.GetBytes("data"));
        writer.Write(dataSize);

        foreach (var sample in samples)
        {
            writer.Write(sample);
        }

        return ms.ToArray();
    }

    #endregion

    #region Private Classes

    private class CaptchaStorageData
    {
        public string Code { get; set; } = string.Empty;
        public int Attempts { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    private class TurnstileVerifyResponse
    {
        public bool Success { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; set; }

        public string? Hostname { get; set; }
    }

    #endregion
}
