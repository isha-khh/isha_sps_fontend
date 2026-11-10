using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SPS.Application.Services;

/// <summary>
/// 比對「內容編輯器（Puck）的區塊 JSON」裡有沒有某個關鍵字。
/// 內文與常見問題的答案存的是 JSON（<c>{"content":[{"type":"Heading","props":{"id":"…","text":"…"}}]}</c>），
/// 直接對整段字串做 contains 會比對到 <c>content</c>、<c>props</c>、<c>text</c> 這類結構字，搜尋「text」會中所有項目。
/// 所以這裡只看 JSON 的「值」：略過 <c>id</c>、<c>type</c> 兩個欄位、網址與圖片路徑，字串裡的 HTML 標籤先拿掉再比。
/// 不是 JSON 的舊資料（純文字或 HTML）就當一般文字比對。
/// </summary>
internal static class RichTextMatcher
{
    private static readonly Regex HtmlTag = new("<[^>]+>", RegexOptions.Compiled);

    public static bool Contains(string? content, string keyword)
    {
        if (string.IsNullOrWhiteSpace(content) || string.IsNullOrEmpty(keyword)) return false;

        var trimmed = content.TrimStart();
        if (trimmed.StartsWith('{') || trimmed.StartsWith('['))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                return Walk(doc.RootElement, keyword);
            }
            catch (JsonException)
            {
                // 長得像 JSON 但解析失敗：退回當一般文字
            }
        }

        return TextContains(content, keyword);
    }

    /// <summary>
    /// 取出內容裡讀者看得到的文字（供建立語意索引用），規則同 <see cref="Contains"/>；
    /// 超過 <paramref name="maxChars"/> 就截斷。
    /// </summary>
    public static string ExtractText(string? content, int maxChars = 2000)
    {
        if (string.IsNullOrWhiteSpace(content)) return string.Empty;
        var sb = new System.Text.StringBuilder();

        var trimmed = content.TrimStart();
        var parsed = false;
        if (trimmed.StartsWith('{') || trimmed.StartsWith('['))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                Collect(doc.RootElement, sb, maxChars);
                parsed = true;
            }
            catch (JsonException)
            {
            }
        }

        if (!parsed) AppendText(content, sb, maxChars);
        return sb.Length > maxChars ? sb.ToString(0, maxChars) : sb.ToString();
    }

    private static void Collect(JsonElement element, System.Text.StringBuilder sb, int maxChars)
    {
        if (sb.Length >= maxChars) return;
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                AppendText(element.GetString(), sb, maxChars);
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray()) Collect(item, sb, maxChars);
                break;
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("id") || property.NameEquals("type")) continue;
                    Collect(property.Value, sb, maxChars);
                }
                break;
        }
    }

    private static void AppendText(string? text, System.Text.StringBuilder sb, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(text) || sb.Length >= maxChars) return;
        if (text.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            text.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            text.StartsWith('/') || text.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return;
        if (text.Contains('<')) text = WebUtility.HtmlDecode(HtmlTag.Replace(text, " "));
        text = text.Trim();
        if (text.Length == 0) return;
        if (sb.Length > 0) sb.Append(' ');
        sb.Append(text);
    }

    private static bool Walk(JsonElement element, string keyword)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                return TextContains(element.GetString(), keyword);
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                    if (Walk(item, keyword)) return true;
                return false;
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("id") || property.NameEquals("type")) continue;
                    if (Walk(property.Value, keyword)) return true;
                }
                return false;
            default:
                return false;
        }
    }

    private static bool TextContains(string? text, string keyword)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        // 網址、站內路徑、內嵌圖片不是讀者看到的文字
        if (text.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            text.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            text.StartsWith('/') || text.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return false;

        if (text.Contains('<')) text = WebUtility.HtmlDecode(HtmlTag.Replace(text, " "));
        return text.Contains(keyword, StringComparison.OrdinalIgnoreCase);
    }
}
