using Microsoft.Extensions.Caching.Memory;

namespace SPS.Api.Services;

/// <summary>
/// 授權 API（匿名端點）的限流與防序號枚舉。計數放在記憶體（目前後端是單一執行個體；多執行個體時要改用 Redis）。
/// 三道：① 每個來源 IP 每分鐘的總呼叫數；② 每個 IP 在一段時間內的「序號錯誤」次數；③ 每個序號（雜湊）每小時的失敗次數。
/// </summary>
public class LicenseRateLimiter
{
    public const int PerIpPerMinute = 30;
    public const int InvalidKeyPerIpPer10Minutes = 10;
    public const int FailuresPerKeyPerHour = 10;

    private readonly IMemoryCache _cache;

    public LicenseRateLimiter(IMemoryCache cache) => _cache = cache;

    private int Increment(string key, TimeSpan window)
    {
        // 固定視窗：第一次出現時設定到期，之後只累加
        var holder = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = window;
            return new Counter();
        })!;
        return Interlocked.Increment(ref holder.Value);
    }

    private int Peek(string key) => _cache.TryGetValue<Counter>(key, out var c) && c != null ? Volatile.Read(ref c.Value) : 0;

    /// <summary>每次呼叫都要先過這一關；回 true 才可以繼續</summary>
    public bool AllowRequest(string ip) => Increment($"lic:ip:{ip}:{DateTime.UtcNow:yyyyMMddHHmm}", TimeSpan.FromMinutes(2)) <= PerIpPerMinute;

    /// <summary>這個 IP 最近是不是已經猜錯太多次序號</summary>
    public bool IsIpBlockedForInvalidKeys(string ip) => Peek($"lic:badkey:{ip}") >= InvalidKeyPerIpPer10Minutes;

    public void RecordInvalidKey(string ip) => Increment($"lic:badkey:{ip}", TimeSpan.FromMinutes(10));

    /// <summary>這把序號（雜湊）最近的失敗次數是否已達上限</summary>
    public bool IsKeyBlocked(string keyHash) => Peek($"lic:keyfail:{keyHash}") >= FailuresPerKeyPerHour;

    public void RecordKeyFailure(string keyHash) => Increment($"lic:keyfail:{keyHash}", TimeSpan.FromHours(1));

    private sealed class Counter { public int Value; }
}
