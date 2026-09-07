using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SPS.Application.Common;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

public class EmbeddingSettings
{
    public bool IsEnabled { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? QueryInstructionPrefix { get; set; }
}

/// <summary>
/// AI 語意搜尋 embedding 服務。透過 LiteLLM 的 OpenAI 相容 /embeddings 端點取得向量。
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §2.2、§2.2.2、§5.7。
/// </summary>
public class EmbeddingService : IEmbeddingService
{
    /// <summary>
    /// 向量維度，需與 ContentEmbeddingConfiguration.EmbeddingDimension 一致（1024 維，
    /// qwen3-embedding 原生 4096 維透過 Matryoshka 截斷取得，見 §5.7）。
    /// </summary>
    public const int EmbeddingDimension = 1024;

    /// <summary>
    /// 查詢端 instruction prefix 預設值（§2.2.2 已驗證對 qwen3-embedding 有效）。
    /// </summary>
    private const string DefaultQueryInstructionPrefix =
        "Instruct: 根據以下工廠智慧化升級需求，找出最能提供對應技術方案或產品服務的供給端業者\nQuery: ";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly EmbeddingSettings _appsettingsFallback;
    private readonly ISystemSettingService _systemSettingService;

    public EmbeddingService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ISystemSettingService systemSettingService)
    {
        _httpClientFactory = httpClientFactory;
        _appsettingsFallback = configuration.GetSection("Embedding").Get<EmbeddingSettings>() ?? new EmbeddingSettings();
        _systemSettingService = systemSettingService;
    }

    private async Task<EmbeddingSettings> GetSettingsAsync(CancellationToken ct)
    {
        var result = await _systemSettingService.GetSettingAsync<EmbeddingSettingsDto>("Embedding", ct);
        if (result.IsSuccess && result.Data != null && !string.IsNullOrEmpty(result.Data.ApiKey))
            return new EmbeddingSettings
            {
                IsEnabled = result.Data.IsEnabled,
                BaseUrl = result.Data.BaseUrl.TrimEnd('/'),
                ApiKey = result.Data.ApiKey,
                Model = result.Data.Model,
                QueryInstructionPrefix = result.Data.QueryInstructionPrefix
            };
        return new EmbeddingSettings
        {
            IsEnabled = _appsettingsFallback.IsEnabled,
            BaseUrl = _appsettingsFallback.BaseUrl.TrimEnd('/'),
            ApiKey = _appsettingsFallback.ApiKey,
            Model = _appsettingsFallback.Model,
            QueryInstructionPrefix = _appsettingsFallback.QueryInstructionPrefix
        };
    }

    public async Task<Result<float[]>> EmbedDocumentAsync(string text, CancellationToken ct = default)
    {
        var settings = await GetSettingsAsync(ct);
        if (!settings.IsEnabled)
            return Result<float[]>.Failure("AI 語意搜尋未啟用");
        if (string.IsNullOrEmpty(settings.ApiKey) || string.IsNullOrEmpty(settings.BaseUrl) || string.IsNullOrEmpty(settings.Model))
            return Result<float[]>.Failure("尚未設定 AI 語意搜尋，請至系統設定完成配置");

        try
        {
            var vector = await CallEmbeddingApiAsync(settings.BaseUrl, settings.ApiKey, settings.Model, text, ct);
            return Result<float[]>.Success(vector);
        }
        catch (Exception ex)
        {
            return Result<float[]>.Failure($"Embedding API 錯誤: {ex.Message}");
        }
    }

    public async Task<Result<float[]>> EmbedQueryAsync(string queryText, CancellationToken ct = default)
    {
        var settings = await GetSettingsAsync(ct);
        if (!settings.IsEnabled)
            return Result<float[]>.Failure("AI 語意搜尋未啟用");
        if (string.IsNullOrEmpty(settings.ApiKey) || string.IsNullOrEmpty(settings.BaseUrl) || string.IsNullOrEmpty(settings.Model))
            return Result<float[]>.Failure("尚未設定 AI 語意搜尋，請至系統設定完成配置");

        var prefix = string.IsNullOrWhiteSpace(settings.QueryInstructionPrefix)
            ? DefaultQueryInstructionPrefix
            : settings.QueryInstructionPrefix;

        try
        {
            var vector = await CallEmbeddingApiAsync(settings.BaseUrl, settings.ApiKey, settings.Model, prefix + queryText, ct);
            return Result<float[]>.Success(vector);
        }
        catch (Exception ex)
        {
            return Result<float[]>.Failure($"Embedding API 錯誤: {ex.Message}");
        }
    }

    public async Task<string?> GetActiveModelNameAsync(CancellationToken ct = default)
    {
        var settings = await GetSettingsAsync(ct);
        return string.IsNullOrWhiteSpace(settings.Model) ? null : settings.Model;
    }

    public async Task<EmbeddingTestResult> TestConnectionAsync(EmbeddingSettingsDto settings, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(settings.ApiKey))
            return new EmbeddingTestResult { Success = false, Message = "API Key 不可為空" };
        if (string.IsNullOrWhiteSpace(settings.BaseUrl))
            return new EmbeddingTestResult { Success = false, Message = "服務位址不可為空" };
        if (string.IsNullOrWhiteSpace(settings.Model))
            return new EmbeddingTestResult { Success = false, Message = "模型名稱不可為空" };

        var stopwatch = Stopwatch.StartNew();
        try
        {
            var vector = await CallEmbeddingApiAsync(settings.BaseUrl.TrimEnd('/'), settings.ApiKey, settings.Model, "測試連線", ct);
            stopwatch.Stop();
            return new EmbeddingTestResult
            {
                Success = true,
                Message = $"連線成功，向量維度 {vector.Length}",
                Dimension = vector.Length,
                LatencyMs = (int)stopwatch.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return new EmbeddingTestResult { Success = false, Message = $"連線失敗：{ex.Message}" };
        }
    }

    /// <summary>
    /// 呼叫 LiteLLM 的 OpenAI 相容 /embeddings 端點。固定帶 dimensions 參數做 Matryoshka 截斷，
    /// 確保向量維度符合 schema（1024 維，見 §5.7）。
    /// </summary>
    private async Task<float[]> CallEmbeddingApiAsync(string baseUrl, string apiKey, string model, string text, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("Embedding");
        var payload = JsonSerializer.Serialize(new { model, input = text, dimensions = EmbeddingDimension });

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/embeddings")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await client.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"呼叫 LiteLLM /embeddings 失敗（status={(int)response.StatusCode}）：{errorBody}");
        }

        var body = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        var vectorElement = doc.RootElement.GetProperty("data")[0].GetProperty("embedding");
        return vectorElement.EnumerateArray().Select(e => e.GetSingle()).ToArray();
    }
}
