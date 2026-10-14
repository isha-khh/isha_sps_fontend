using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Sps.XrLicense;

/// <summary>授權檔的內容（欄位名稱即對外規格，snake_case）。時間皆為 UTC ISO 8601。</summary>
public sealed class LicensePayload
{
    [JsonPropertyName("kid")] public string Kid { get; set; } = "";
    [JsonPropertyName("license_id")] public string LicenseId { get; set; } = "";
    [JsonPropertyName("product")] public string Product { get; set; } = "";
    [JsonPropertyName("customer")] public string Customer { get; set; } = "";
    [JsonPropertyName("member_id")] public string MemberId { get; set; } = "";
    [JsonPropertyName("edition")] public string Edition { get; set; } = "";
    [JsonPropertyName("features")] public string[] Features { get; set; } = [];
    [JsonPropertyName("seats")] public int Seats { get; set; }
    [JsonPropertyName("device_hash")] public string DeviceHash { get; set; } = "";
    [JsonPropertyName("issued_at")] public DateTime IssuedAt { get; set; }
    [JsonPropertyName("valid_until")] public DateTime ValidUntil { get; set; }
    [JsonPropertyName("lease_until")] public DateTime LeaseUntil { get; set; }
    [JsonPropertyName("server_time")] public DateTime ServerTime { get; set; }
}

public enum VerifyStatus
{
    /// <summary>簽章有效、裝置相符、仍在租約內</summary>
    Valid,
    /// <summary>簽章有效，但租約（lease_until）已過：請連線呼叫 /refresh</summary>
    LeaseExpired,
    /// <summary>簽章有效，但 valid_until 已過：授權不再有效，需連線確認（通常會被拒絕）</summary>
    ValidUntilPassed,
    /// <summary>系統時間比本機記錄的 server_time 還早：疑似倒轉時鐘，要求連線續期</summary>
    ClockRollback,
    /// <summary>授權檔不是這台裝置的（device_hash 不符）</summary>
    DeviceMismatch,
    /// <summary>格式錯誤、kid 不認得、簽章不符、產品不符：視為沒有授權</summary>
    Invalid,
}

public sealed record VerifyResult(VerifyStatus Status, LicensePayload? Payload, string? Detail = null);

/// <summary>
/// 授權檔驗證（離線即可執行，不需要網路）。
/// 重點：
///  1. 授權檔 = base64url(payload).base64url(signature)，簽章簽的是 payload「原始位元組」，不要解析後重新序列化。
///  2. 簽章是 ECDSA P-256 + SHA-256，編碼為 IEEE P1363（r‖s，64 位元組）——.NET 的 ECDsa.VerifyData 預設就是這個，
///     所以直接呼叫即可。若你的簽章是 DER（例如直接拿 Cloud KMS／OpenSSL 的輸出），要改指定
///     DSASignatureFormat.Rfc3279DerSequence；本系統發出的授權檔一律是 P1363。
///  3. 公鑰（SubjectPublicKeyInfo，base64）內嵌在程式裡，依授權檔的 kid 選用；測試與正式環境各一把。
/// </summary>
public sealed class LicenseVerifier
{
    private readonly Dictionary<string, ECDsa> _keys = new(StringComparer.Ordinal);

    /// <param name="spkiByKid">kid → SPKI base64（來自 GET /api/license/v1/public-keys 或我們提供的公鑰）</param>
    public LicenseVerifier(IReadOnlyDictionary<string, string> spkiByKid)
    {
        foreach (var (kid, spki) in spkiByKid)
        {
            var ecdsa = ECDsa.Create();
            ecdsa.ImportSubjectPublicKeyInfo(Convert.FromBase64String(spki), out _);
            _keys[kid] = ecdsa;
        }
    }

    /// <param name="license">本機保存的授權檔字串</param>
    /// <param name="localDeviceHash">這台裝置目前算出的 device_hash</param>
    /// <param name="nowUtc">目前時間（UTC）</param>
    /// <param name="lastSeenServerTime">本機上次記錄到的 server_time（每次收到新授權檔就更新並保存）；沒有就傳 null</param>
    public VerifyResult Verify(string license, string localDeviceHash, DateTime nowUtc, DateTime? lastSeenServerTime = null)
    {
        var parts = license.Trim().Split('.');
        if (parts.Length != 2) return new(VerifyStatus.Invalid, null, "格式錯誤");

        byte[] payloadBytes, signature;
        try
        {
            payloadBytes = Base64UrlDecode(parts[0]);
            signature = Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return new(VerifyStatus.Invalid, null, "base64url 解碼失敗");
        }

        LicensePayload? payload;
        try { payload = JsonSerializer.Deserialize<LicensePayload>(payloadBytes); }
        catch (JsonException) { return new(VerifyStatus.Invalid, null, "payload 不是有效的 JSON"); }
        if (payload is null) return new(VerifyStatus.Invalid, null, "payload 為空");

        // 依 kid 選公鑰；沒有就是不認得（可能是別的環境簽的，或新的金鑰——可呼叫 /public-keys 更新）
        if (!_keys.TryGetValue(payload.Kid, out var key)) return new(VerifyStatus.Invalid, payload, $"不認得的 kid：{payload.Kid}");

        // 簽的是原始位元組；.NET 預設即 P1363（r||s）
        if (signature.Length != 64 || !key.VerifyData(payloadBytes, signature, HashAlgorithmName.SHA256))
            return new(VerifyStatus.Invalid, payload, "簽章不符");

        if (!string.Equals(payload.Product, "xr", StringComparison.Ordinal)) return new(VerifyStatus.Invalid, payload, "產品不符");
        if (!string.Equals(payload.DeviceHash, localDeviceHash, StringComparison.Ordinal)) return new(VerifyStatus.DeviceMismatch, payload);

        // 時鐘倒轉：現在比上次記錄的伺服器時間還早（容忍 5 分鐘誤差）
        if (lastSeenServerTime is { } last && nowUtc < last.AddMinutes(-5)) return new(VerifyStatus.ClockRollback, payload);
        if (nowUtc < payload.ServerTime.AddMinutes(-5)) return new(VerifyStatus.ClockRollback, payload);

        if (nowUtc > payload.ValidUntil) return new(VerifyStatus.ValidUntilPassed, payload);
        if (nowUtc > payload.LeaseUntil) return new(VerifyStatus.LeaseExpired, payload);
        return new(VerifyStatus.Valid, payload);
    }

    private static byte[] Base64UrlDecode(string text)
    {
        var s = text.Trim().Replace('-', '+').Replace('_', '/');
        s = s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=');
        return Convert.FromBase64String(s);
    }
}
