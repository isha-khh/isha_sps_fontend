using System.Text.Json;
using System.Text.Json.Serialization;

namespace SPS.Application.Services.Licensing;

/// <summary>
/// 授權檔的內容（簽章的對象）。欄位名稱是對外規格（snake_case），給廠商的文件以這裡為準。
/// 時間一律 UTC、ISO 8601、秒為單位（<c>yyyy-MM-ddTHH:mm:ssZ</c>）；簽章簽的是這段 JSON 的原始位元組，客戶端不要重新序列化。
/// </summary>
public class LicensePayload
{
    [JsonPropertyName("kid")] public string Kid { get; set; } = string.Empty;
    [JsonPropertyName("license_id")] public string LicenseId { get; set; } = string.Empty;
    [JsonPropertyName("product")] public string Product { get; set; } = string.Empty;
    [JsonPropertyName("customer")] public string Customer { get; set; } = string.Empty;
    [JsonPropertyName("member_id")] public string MemberId { get; set; } = string.Empty;
    [JsonPropertyName("edition")] public string Edition { get; set; } = "standard";
    [JsonPropertyName("features")] public string[] Features { get; set; } = Array.Empty<string>();
    [JsonPropertyName("seats")] public int Seats { get; set; }
    [JsonPropertyName("device_hash")] public string DeviceHash { get; set; } = string.Empty;
    [JsonPropertyName("issued_at")] public string IssuedAt { get; set; } = string.Empty;
    [JsonPropertyName("valid_until")] public string ValidUntil { get; set; } = string.Empty;
    [JsonPropertyName("lease_until")] public string LeaseUntil { get; set; } = string.Empty;
    [JsonPropertyName("server_time")] public string ServerTime { get; set; } = string.Empty;

    private static readonly JsonSerializerOptions Options = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, // 中文公司名稱不要轉成 \uXXXX（簽章只簽位元組，兩種都合法，但可讀性較好）
    };

    public static string FormatTime(DateTime utc) => DateTime.SpecifyKind(utc, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", System.Globalization.CultureInfo.InvariantCulture);

    public byte[] ToBytes() => JsonSerializer.SerializeToUtf8Bytes(this, Options);

    public static LicensePayload? Parse(byte[] json)
    {
        try { return JsonSerializer.Deserialize<LicensePayload>(json, Options); }
        catch (JsonException) { return null; }
    }

    /// <summary>組成授權檔字串：<c>base64url(payload).base64url(signature)</c></summary>
    public static string Compose(byte[] payload, byte[] signatureP1363) => $"{LicenseCrypto.Base64UrlEncode(payload)}.{LicenseCrypto.Base64UrlEncode(signatureP1363)}";

    /// <summary>拆開授權檔字串；格式不對回 null</summary>
    public static (byte[] Payload, byte[] Signature)? Split(string? license)
    {
        if (string.IsNullOrWhiteSpace(license) || license.Length > 8192) return null;
        var parts = license.Trim().Split('.');
        if (parts.Length != 2) return null;
        try { return (LicenseCrypto.Base64UrlDecode(parts[0]), LicenseCrypto.Base64UrlDecode(parts[1])); }
        catch (FormatException) { return null; }
    }
}
