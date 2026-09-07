using System.Text.Json;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SPS.Application.Common;
using SPS.Application.DTOs.ProTrack;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

[assembly: InternalsVisibleTo("SPS.IntegrationTests")]

namespace SPS.Infrastructure.Services;

public class ProTrackSettings
{
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;
}

public class ProTrackService : IProTrackService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ProTrackSettings _appsettingsFallback;
    private readonly ISystemSettingService _systemSettingService;
    private readonly ApplicationDbContext _db;

    // ProTrack 表單欄位 ID（固定不變）
    private const string FieldCompanyName = "field_1776668363081";
    private const string FieldDate = "field_1777444898400";
    private const string FieldConsultant = "field_1779851849867";
    private const string FieldRecommendation = "field_1777439844674";
    private const string FieldApplicationScope = "field_1777439963492";

    public ProTrackService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ISystemSettingService systemSettingService,
        ApplicationDbContext db)
    {
        _httpClientFactory = httpClientFactory;
        _appsettingsFallback = configuration.GetSection("ProTrack").Get<ProTrackSettings>() ?? new ProTrackSettings();
        _systemSettingService = systemSettingService;
        _db = db;
    }

    private async Task<ProTrackSettings> GetSettingsAsync(CancellationToken ct)
    {
        var result = await _systemSettingService.GetSettingAsync<ProTrackSettingsDto>("ProTrack", ct);
        if (result.IsSuccess && result.Data != null && !string.IsNullOrEmpty(result.Data.ApiKey))
            return new ProTrackSettings
            {
                BaseUrl = result.Data.BaseUrl.TrimEnd('/'),
                ApiKey = result.Data.ApiKey,
                FormId = result.Data.FormId
            };
        return new ProTrackSettings
        {
            BaseUrl = _appsettingsFallback.BaseUrl.TrimEnd('/'),
            ApiKey = _appsettingsFallback.ApiKey,
            FormId = _appsettingsFallback.FormId
        };
    }

    public async Task<Result<int>> TestConnectionAsync(ProTrackSettingsDto settings, CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(settings.ApiKey))
                return Result<int>.Failure("API Key 不可為空");
            if (string.IsNullOrWhiteSpace(settings.BaseUrl))
                return Result<int>.Failure("API 基底網址不可為空");
            if (string.IsNullOrWhiteSpace(settings.FormId))
                return Result<int>.Failure("表單 ID 不可為空");

            var ps = new ProTrackSettings
            {
                BaseUrl = settings.BaseUrl.TrimEnd('/'),
                ApiKey = settings.ApiKey,
                FormId = settings.FormId
            };
            var doc = await FetchSubmissionsDocAsync(ps, ct);

            var count = 0;
            if (TryGetObjectProperty(doc.RootElement, "totalCount", out var tc))
                count = tc.GetInt32();

            return Result<int>.Success(count);
        }
        catch (HttpRequestException ex)
        {
            var status = ex.StatusCode.HasValue ? $" (HTTP {(int)ex.StatusCode})" : "";
            return Result<int>.Failure($"連線失敗{status}：{ex.Message}");
        }
        catch (Exception ex)
        {
            return Result<int>.Failure($"測試失敗：{ex.Message}");
        }
    }

    public async Task<Result<List<ProTrackSubmissionItem>>> GetSubmissionsAsync(CancellationToken ct = default)
    {
        try
        {
            var settings = await GetSettingsAsync(ct);
            if (string.IsNullOrEmpty(settings.ApiKey))
                return Result<List<ProTrackSubmissionItem>>.Failure("尚未設定 ProTrack API Key，請至系統設定 → 訂閱設定完成配置");

            var doc = await FetchSubmissionsDocAsync(settings, ct);
            var items = ParseSubmissionsList(doc.RootElement);

            return Result<List<ProTrackSubmissionItem>>.Success(items);
        }
        catch (Exception ex)
        {
            return Result<List<ProTrackSubmissionItem>>.Failure($"ProTrack API 錯誤: {ex.Message}");
        }
    }

    public async Task<Result<ProTrackImportResult>> ParseSubmissionAsync(string submissionId, CancellationToken ct = default)
    {
        try
        {
            var settings = await GetSettingsAsync(ct);
            var doc = await FetchSubmissionsDocAsync(settings, ct);

            var target = FindSubmissionById(doc.RootElement, submissionId);

            if (target == null)
                return Result<ProTrackImportResult>.Failure("找不到指定的表單提交記錄");

            var result = await ParseToImportResultAsync(target.Value, ct);
            return Result<ProTrackImportResult>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<ProTrackImportResult>.Failure($"解析表單資料失敗: {ex.Message}");
        }
    }

    private async Task<JsonDocument> FetchSubmissionsDocAsync(ProTrackSettings settings, CancellationToken ct)
    {
        var url = $"{settings.BaseUrl}/forms/{settings.FormId}/submissions/pull";

        // macOS 26 (Tahoe) has a TLS 1.3 incompatibility in .NET's Apple TLS stack;
        // fall back to the system curl (LibreSSL) which works correctly.
        if (OperatingSystem.IsMacOS())
            return await FetchViaCurlAsync(url, settings.ApiKey, ct);

        var client = _httpClientFactory.CreateClient("ProTrack");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("X-Api-Key", settings.ApiKey);
        var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        var text = await response.Content.ReadAsStringAsync(ct);
        return ParseJsonOrThrow(text, url);
    }

    private static JsonDocument ParseJsonOrThrow(string text, string url)
    {
        try
        {
            return JsonDocument.Parse(text);
        }
        catch (JsonException)
        {
            var preview = text.Length > 200 ? text[..200] : text;
            throw new InvalidOperationException(
                $"ProTrack API 回應非預期的 JSON 格式（可能是網址設定錯誤，命中了非 API 的頁面）。" +
                $"請求網址：{url}，回應內容開頭：{preview}");
        }
    }

    private static async Task<JsonDocument> FetchViaCurlAsync(string url, string apiKey, CancellationToken ct)
    {
        var psi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "curl",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };
        psi.ArgumentList.Add("-s");
        psi.ArgumentList.Add("--fail-with-body");
        psi.ArgumentList.Add("-H");
        psi.ArgumentList.Add($"X-Api-Key: {apiKey}");
        psi.ArgumentList.Add(url);

        using var process = System.Diagnostics.Process.Start(psi)
            ?? throw new InvalidOperationException("無法啟動 curl");

        var jsonTask = process.StandardOutput.ReadToEndAsync(ct);
        var errTask = process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);
        var json = await jsonTask;
        var err = await errTask;

        if (process.ExitCode != 0)
            throw new HttpRequestException($"curl 失敗 (exit {process.ExitCode}): {err.Trim()}");

        return ParseJsonOrThrow(json, url);
    }

    /// <summary>
    /// 解析 submissions/pull 回應的 "items" 陣列為列表項目。
    /// 對每個項目的欄位（包含 submittedBy 等可能為 JSON null 的欄位）皆做型別安全存取，
    /// 避免因單一筆記錄的欄位為 null 造成整批解析失敗。
    /// </summary>
    internal static List<ProTrackSubmissionItem> ParseSubmissionsList(JsonElement root)
    {
        var items = new List<ProTrackSubmissionItem>();
        if (!TryGetObjectProperty(root, "items", out var itemsEl) || itemsEl.ValueKind != JsonValueKind.Array)
            return items;

        foreach (var itemEl in itemsEl.EnumerateArray())
        {
            if (!TryGetObjectProperty(itemEl, "submission", out var sub) || sub.ValueKind != JsonValueKind.Object) continue;
            items.Add(ParseToListItem(sub));
        }

        return items;
    }

    /// <summary>
    /// 在 submissions/pull 回應的 "items" 陣列中，依 submissionId 尋找對應的 submission 物件。
    /// </summary>
    internal static JsonElement? FindSubmissionById(JsonElement root, string submissionId)
    {
        if (!TryGetObjectProperty(root, "items", out var itemsEl) || itemsEl.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var itemEl in itemsEl.EnumerateArray())
        {
            if (!TryGetObjectProperty(itemEl, "submission", out var sub) || sub.ValueKind != JsonValueKind.Object) continue;
            if (TryGetObjectProperty(sub, "id", out var idEl)
                && idEl.ValueKind == JsonValueKind.String
                && idEl.GetString() == submissionId)
                return sub;
        }

        return null;
    }

    private static ProTrackSubmissionItem ParseToListItem(JsonElement sub)
    {
        var parsedFields = GetParsedFields(sub);
        var recommendations = GetFieldValues(parsedFields, FieldRecommendation);

        return new ProTrackSubmissionItem
        {
            Id = GetString(sub, "id"),
            CompanyName = GetFieldValue(parsedFields, FieldCompanyName),
            Date = GetFieldValue(parsedFields, FieldDate),
            Consultant = GetFieldValue(parsedFields, FieldConsultant),
            SubmittedBy = GetNestedString(sub, "submittedBy", "username"),
            SubmittedAt = GetString(sub, "submittedAt"),
            RecommendationCount = recommendations.Count,
            Summary = recommendations.FirstOrDefault() ?? ""
        };
    }

    private async Task<ProTrackImportResult> ParseToImportResultAsync(JsonElement sub, CancellationToken ct)
    {
        var parsedFields = GetParsedFields(sub);
        var companyName = GetFieldValue(parsedFields, FieldCompanyName);
        var date = GetFieldValue(parsedFields, FieldDate);
        var consultant = GetFieldValue(parsedFields, FieldConsultant);
        var recommendations = GetFieldValues(parsedFields, FieldRecommendation);
        var scopeValues = GetFieldValues(parsedFields, FieldApplicationScope);

        var suggestedName = string.IsNullOrEmpty(date)
            ? $"{companyName} 智慧安全需求"
            : $"{companyName} 智慧安全需求（{date}）";

        var suggestedIntro = recommendations.Count > 0
            ? string.Join("\n", recommendations.Select((r, i) => $"{i + 1}. {r}"))
            : "";

        Guid? matchedId = null;
        string? matchedName = null;
        if (!string.IsNullOrEmpty(companyName))
        {
            var matched = await _db.Set<Company>()
                .Where(c => c.Name == companyName || c.Name.Contains(companyName))
                .Select(c => new { c.Id, c.Name })
                .FirstOrDefaultAsync(ct);
            if (matched != null) { matchedId = matched.Id; matchedName = matched.Name; }
        }

        // "應用範疇" 為 checkbox 多選欄位，displayValue 是以逗號分隔的字串（如 "人員, 能源"）
        var scopeNames = scopeValues
            .SelectMany(v => v.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            .Distinct()
            .ToList();

        var suggestedTagIds = new List<int>();
        var suggestedTagNames = new List<string>();
        if (scopeNames.Count > 0)
        {
            var matchedTags = await _db.Set<Category>()
                .Where(c => c.Type == CategoryType.CompanyTag && c.Name != null && scopeNames.Contains(c.Name))
                .Select(c => new { c.Id, c.Name })
                .ToListAsync(ct);
            suggestedTagIds = matchedTags.Select(t => t.Id).ToList();
            suggestedTagNames = matchedTags.Select(t => t.Name!).ToList();
        }

        return new ProTrackImportResult
        {
            SubmissionId = GetString(sub, "id"),
            CompanyName = companyName,
            Date = date,
            Consultant = consultant,
            SuggestedName = suggestedName,
            SuggestedIntroduction = suggestedIntro,
            MatchedCompanyId = matchedId,
            MatchedCompanyName = matchedName,
            SuggestedTagIds = suggestedTagIds,
            SuggestedTagNames = suggestedTagNames
        };
    }

    private static List<JsonElement> GetParsedFields(JsonElement sub)
    {
        if (!TryGetObjectProperty(sub, "parsedFields", out var pf) || pf.ValueKind != JsonValueKind.Array)
            return new List<JsonElement>();
        return pf.EnumerateArray().ToList();
    }

    private static string GetFieldValue(List<JsonElement> fields, string fieldName)
    {
        foreach (var f in fields)
        {
            if (TryGetObjectProperty(f, "fieldName", out var fn)
                && fn.ValueKind == JsonValueKind.String && fn.GetString() == fieldName
                && TryGetObjectProperty(f, "displayValue", out var dv)
                && dv.ValueKind == JsonValueKind.String)
                return dv.GetString() ?? "";
        }
        return "";
    }

    private static List<string> GetFieldValues(List<JsonElement> fields, string fieldName)
    {
        var result = new List<string>();
        foreach (var f in fields)
        {
            if (TryGetObjectProperty(f, "fieldName", out var fn)
                && fn.ValueKind == JsonValueKind.String && fn.GetString() == fieldName
                && TryGetObjectProperty(f, "displayValue", out var dv)
                && dv.ValueKind == JsonValueKind.String)
            {
                var val = dv.GetString();
                if (!string.IsNullOrWhiteSpace(val)) result.Add(val);
            }
        }
        return result;
    }

    private static string GetString(JsonElement el, string key)
        => TryGetObjectProperty(el, key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";

    private static string GetNestedString(JsonElement el, string key1, string key2)
        => TryGetObjectProperty(el, key1, out var inner) ? GetString(inner, key2) : "";

    /// <summary>
    /// 安全版的 JsonElement.TryGetProperty：呼叫前先確認 el 本身是 Object 型別。
    /// .NET 的 JsonElement.TryGetProperty 在 el 本身不是 Object（例如是 JSON null）時會直接
    /// 拋出 InvalidOperationException("...requires an element of type 'Object'...")，
    /// 而非單純回傳 false；ProTrack API 部分欄位（如 submittedBy）在無值時是 JSON null 而非
    /// 缺少該欄位，若未先檢查 ValueKind 會導致整批解析失敗。
    /// </summary>
    private static bool TryGetObjectProperty(JsonElement el, string name, out JsonElement value)
    {
        if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out value))
            return true;
        value = default;
        return false;
    }
}
