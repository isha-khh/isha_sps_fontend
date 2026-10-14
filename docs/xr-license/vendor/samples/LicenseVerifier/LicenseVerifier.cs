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

    /// <summary>"online"（線上啟用／續期）或 "offline"（離線啟用）。舊版授權檔沒有這個欄位，視為 online。</summary>
    [JsonPropertyName("mode")] public string Mode { get; set; } = "online";

    /// <summary>離線啟用的授權檔才有：等於你產生 .req 時放進去的 nonce。匯入時必須比對。</summary>
    [JsonPropertyName("nonce")] public string? Nonce { get; set; }
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
    /// <summary>離線匯入時，授權檔裡的 nonce 與你產生 .req 時的不同：這不是你剛才請求的那份授權檔，拒絕匯入</summary>
    NonceMismatch,
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
    /// <param name="expectedNonce">
    /// 只有「匯入使用者帶回來的離線授權檔」時才傳：你產生 .req 時保存的 nonce。啟動時的例行驗證與線上續期取得的授權檔不要傳。
    /// </param>
    public VerifyResult Verify(string license, string localDeviceHash, DateTime nowUtc, DateTime? lastSeenServerTime = null, string? expectedNonce = null)
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

        if (expectedNonce is not null && !string.Equals(payload.Nonce, expectedNonce, StringComparison.Ordinal)) return new(VerifyStatus.NonceMismatch, payload);

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

/// <summary>
/// 離線啟用／離線停用的檔案產生（離線電腦上的 XR 軟體執行）。檔案內容都是 base64url(JSON) 的單行文字，
/// 存成 .req／.deact 檔或讓使用者複製貼上均可。格式見《離線授權》文件。
/// </summary>
public static class OfflineFiles
{
    private static string Base64Url(byte[] data) => Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static string Encode(object value) => Base64Url(JsonSerializer.SerializeToUtf8Bytes(value));

    /// <summary>產生一次性 nonce（16 位元組隨機，22 個字元）。請保存起來，匯入授權檔時用來比對。</summary>
    public static string NewNonce() => Base64Url(RandomNumberGenerator.GetBytes(16));

    /// <summary>
    /// 產生離線啟用請求（.req）。<paramref name="nonce"/> 請用 <see cref="NewNonce"/> 產生並保存到匯入授權檔為止。
    /// 同一台裝置要「續期」時也是產生新的請求檔（新的 nonce）。
    /// </summary>
    public static string CreateActivationRequest(string licenseKey, string deviceHash, string deviceName, string clientVersion, string nonce, DateTime nowUtc)
        => Encode(new Dictionary<string, object>
        {
            ["v"] = 1,
            ["type"] = "activate",
            ["license_key"] = licenseKey,
            ["device_hash"] = deviceHash,
            ["device_name"] = deviceName,
            ["client_version"] = clientVersion,
            ["nonce"] = nonce,
            ["created_at"] = nowUtc.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", System.Globalization.CultureInfo.InvariantCulture),
        });

    /// <summary>產生離線停用憑證（.deact）。產生後軟體要立刻清除本機授權檔並鎖定。</summary>
    public static string CreateDeactivationCertificate(string currentLicenseFile, string deviceHash, DateTime nowUtc)
        => Encode(new Dictionary<string, object>
        {
            ["v"] = 1,
            ["type"] = "deactivate",
            ["license"] = currentLicenseFile,
            ["device_hash"] = deviceHash,
            ["nonce"] = NewNonce(),
            ["created_at"] = nowUtc.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", System.Globalization.CultureInfo.InvariantCulture),
        });
}
