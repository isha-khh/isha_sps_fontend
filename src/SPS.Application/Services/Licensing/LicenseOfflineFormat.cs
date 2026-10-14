using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace SPS.Application.Services.Licensing;

/// <summary>離線啟用請求（.req）：離線電腦產生，會員帶到有網路的電腦上傳到會員中心</summary>
public class OfflineActivationRequest
{
    [JsonPropertyName("v")] public int Version { get; set; }
    [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
    [JsonPropertyName("license_key")] public string? LicenseKey { get; set; }
    [JsonPropertyName("device_hash")] public string? DeviceHash { get; set; }
    [JsonPropertyName("device_name")] public string? DeviceName { get; set; }
    [JsonPropertyName("client_version")] public string? ClientVersion { get; set; }
    [JsonPropertyName("nonce")] public string? Nonce { get; set; }
    [JsonPropertyName("created_at")] public string? CreatedAt { get; set; }
}

/// <summary>離線停用憑證（.deact）：舊電腦產生，內含目前的授權檔（證明持有）；產生後客戶端應立刻清除本機授權檔</summary>
public class OfflineDeactivationCertificate
{
    [JsonPropertyName("v")] public int Version { get; set; }
    [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
    [JsonPropertyName("license")] public string? License { get; set; }
    [JsonPropertyName("device_hash")] public string? DeviceHash { get; set; }
    [JsonPropertyName("nonce")] public string? Nonce { get; set; }
    [JsonPropertyName("created_at")] public string? CreatedAt { get; set; }
}

/// <summary>
/// 離線檔案（.req／.deact）的格式與驗證（純函式，不依賴資料庫）。檔案內容是 <c>base64url(JSON)</c> 的單行文字，
/// 方便複製貼上也方便存成檔案。格式是對外規格，見 docs/xr-license/vendor/離線授權.md。
/// </summary>
public static class LicenseOfflineFormat
{
    public const int Version = 1;
    public const string TypeActivate = "activate";
    public const string TypeDeactivate = "deactivate";

    /// <summary>請求檔從產生到上傳的有效期（離線電腦要帶到有網路的電腦，比線上流程寬鬆）</summary>
    public static readonly TimeSpan RequestMaxAge = TimeSpan.FromHours(24);

    /// <summary>離線電腦時鐘比伺服器快的容忍範圍</summary>
    public static readonly TimeSpan ClockSkewTolerance = TimeSpan.FromMinutes(10);

    private const int MaxFileLength = 16 * 1024;
    private static readonly Regex NonceFormat = new("^[A-Za-z0-9_-]{16,64}$", RegexOptions.Compiled);

    /// <summary>解析 .req／.deact 的文字內容；格式不對回 null（內容中的空白與換行會先移除，方便從不同編輯器貼上）</summary>
    public static T? Parse<T>(string? text) where T : class
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var compact = new string(text.Where(c => !char.IsWhiteSpace(c) && c != '﻿').ToArray());
        if (compact.Length == 0 || compact.Length > MaxFileLength) return null;
        try
        {
            return JsonSerializer.Deserialize<T>(Encoding.UTF8.GetString(LicenseCrypto.Base64UrlDecode(compact)));
        }
        catch (Exception ex) when (ex is FormatException or JsonException or ArgumentException)
        {
            return null;
        }
    }

    public static bool IsValidNonce(string? nonce) => nonce != null && NonceFormat.IsMatch(nonce);

    /// <summary>檢查請求檔的時間：不能太舊，也不能比現在晚太多。通過回 null，否則回給會員看的訊息</summary>
    public static string? CheckCreatedAt(string? createdAt, DateTime nowUtc)
    {
        if (!DateTime.TryParse(createdAt, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var created))
            return "請求檔的產生時間格式不正確";
        if (created < nowUtc - RequestMaxAge)
            return $"請求檔是 {(int)RequestMaxAge.TotalHours} 小時前產生的，已經過期。請在離線電腦重新產生請求檔";
        if (created > nowUtc + ClockSkewTolerance)
            return "離線電腦的時間比現在晚太多，請先校正離線電腦的日期時間，再重新產生請求檔";
        return null;
    }
}
