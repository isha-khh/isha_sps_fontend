using Microsoft.Extensions.Caching.Memory;

namespace SPS.Api.Hubs;

/// <summary>
/// 「對方正在輸入」的暫存狀態：輸入中的人每隔幾秒回報一次，這裡記 <see cref="Ttl"/> 秒，過期就當作停止輸入。
/// 即時連線（後台客服）收到事件直接顯示；前台會員用輪詢，所以要能被查詢。放在記憶體，後端只有一個執行個體時成立；
/// 重啟後會遺失，影響只是提示消失，不影響訊息。
/// </summary>
public static class ChatTypingState
{
    public static readonly TimeSpan Ttl = TimeSpan.FromSeconds(5);

    private static string Key(long chatRecordId, string senderType) => $"chat-typing:{chatRecordId}:{senderType}";

    public static void Set(IMemoryCache cache, long chatRecordId, string senderType) => cache.Set(Key(chatRecordId, senderType), true, Ttl);

    public static void Clear(IMemoryCache cache, long chatRecordId, string senderType) => cache.Remove(Key(chatRecordId, senderType));

    public static bool IsTyping(IMemoryCache cache, long chatRecordId, string senderType) => cache.TryGetValue(Key(chatRecordId, senderType), out _);
}
