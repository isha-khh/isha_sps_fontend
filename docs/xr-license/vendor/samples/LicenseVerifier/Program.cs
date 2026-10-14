using System.Text.Json;
using Sps.XrLicense;

// 用法：dotnet run -- ../../test-vectors/vectors.json
// 讀測試向量檔，逐一驗證並印出結果；全部符合預期時結束碼為 0。
var path = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "../../../../../test-vectors/vectors.json");
using var doc = JsonDocument.Parse(File.ReadAllText(path));
var root = doc.RootElement;

var kid = root.GetProperty("public_key").GetProperty("kid").GetString()!;
var spki = root.GetProperty("public_key").GetProperty("spki_base64").GetString()!;
var verifier = new LicenseVerifier(new Dictionary<string, string> { [kid] = spki });
var deviceHash = root.GetProperty("device_hash").GetString()!;

var failed = 0;
foreach (var c in root.GetProperty("cases").EnumerateArray())
{
    var name = c.GetProperty("name").GetString()!;
    var license = c.GetProperty("license").GetString()!;
    var local = c.TryGetProperty("device_hash_local", out var dh) ? dh.GetString()! : deviceHash;
    // 預設時間點：在 valid 案例的租約內
    var now = c.TryGetProperty("now", out var n) ? DateTime.Parse(n.GetString()!).ToUniversalTime() : new DateTime(2026, 10, 21, 0, 0, 0, DateTimeKind.Utc);
    var expect = c.GetProperty("expect");

    var nonce = c.TryGetProperty("expected_nonce", out var en) ? en.GetString() : null;
    var result = verifier.Verify(license, local, now, null, nonce);

    var sigValid = result.Status != VerifyStatus.Invalid;
    var deviceMatches = result.Status is not (VerifyStatus.Invalid or VerifyStatus.DeviceMismatch);
    if (expect.TryGetProperty("status", out var st) && result.Status.ToString() != st.GetString())
    {
        Console.WriteLine($"FAIL  {name,-32} => {result.Status} (expected {st.GetString()})");
        failed++;
        continue;
    }
    var ok = sigValid == expect.GetProperty("signature_valid").GetBoolean();
    if (expect.TryGetProperty("device_hash_matches", out var dm)) ok &= deviceMatches == dm.GetBoolean();
    if (expect.TryGetProperty("lease_expired", out var le)) ok &= (result.Status == VerifyStatus.LeaseExpired) == le.GetBoolean();
    if (name == "valid") ok &= result.Status == VerifyStatus.Valid;

    Console.WriteLine($"{(ok ? "PASS" : "FAIL")}  {name,-32} => {result.Status} {result.Detail}");
    if (!ok) failed++;
}
// 離線檔案產生器：確認輸出可以被解開、欄位齊全（伺服器端格式見《離線授權》）
var reqNonce = OfflineFiles.NewNonce();
var req = OfflineFiles.CreateActivationRequest("XR-ABCD-EFGH-JKMN-PQRS", deviceHash, "測試電腦", "1.0.0", reqNonce, DateTime.UtcNow);
var reqJson = JsonDocument.Parse(Convert.FromBase64String(req.Replace('-', '+').Replace('_', '/').PadRight(req.Length + (4 - req.Length % 4) % 4, '=')));
var reqOk = reqJson.RootElement.GetProperty("type").GetString() == "activate" && reqJson.RootElement.GetProperty("nonce").GetString() == reqNonce && reqNonce.Length is >= 16 and <= 64;
Console.WriteLine($"{(reqOk ? "PASS" : "FAIL")}  {"offline request builder",-32}");
if (!reqOk) failed++;
return failed == 0 ? 0 : 1;
