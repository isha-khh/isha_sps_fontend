using System.Text.Json;
using SPS.Application.Interfaces.IServices;

namespace SPS.Application.Services;

/// <summary>
/// 文章內容檢查規則（純函式，沒有資料庫依賴）。對應後台編輯器的 <c>content-rules.ts</c>，兩邊改規則要一起改。
/// 輸入是 Puck 存下來的 JSON（<c>{ "content": [ { "type": "...", "props": {...} } ] }</c>）。
/// 判斷標題層級時假設文章頁自己的標題是 H2，內容裡「區塊自己輸出的標題」要從它往下接，不能跳級；
/// 富文字裡的標題不檢查（前台顯示時會依相對結構重排）。
/// </summary>
public static class ArticleContentRules
{
    private const int PageTitleLevel = 2;

    /// <summary>舊版圖片區塊的預設替代文字，沒改就存的內容會被無障礙檢測退件</summary>
    private const string SampleAlt = "這是一張範例圖片";

    /// <summary>
    /// 編輯器元件的預設範例文字：內容裡還留著這些字，代表編輯者沒把範例改成真正的內容就發布了（錯誤）。
    /// 掃區塊裡所有文字欄位，不分欄位。之後發現別的元件也有會被忘記改的預設值，加在這裡就好（後台 content-rules.ts 要同步）。
    /// </summary>
    private static readonly string[] PlaceholderKeywords = { SampleAlt };

    private static readonly Dictionary<string, string> BlockLabels = new()
    {
        ["HeroBlock"] = "標題區塊",
        ["FeatureList"] = "特色清單",
        ["CallToAction"] = "行動呼籲",
        ["FileDownloads"] = "附件下載",
        ["RelatedLinks"] = "相關連結",
        ["ContactInfo"] = "聯絡資訊",
        ["ImageFeature"] = "圖片區塊",
        ["NavigationCard"] = "導覽卡片",
        ["ArticleContent"] = "文章內容",
    };

    private static readonly HashSet<string> GenericLinkTexts = new(StringComparer.OrdinalIgnoreCase)
    {
        "點此", "點擊此處", "點擊這裡", "這裡", "此處", "更多", "詳情", "click here", "here", "more", "read more",
    };

    public static IReadOnlyList<ArticleContentIssue> Validate(string? content)
    {
        var issues = new List<ArticleContentIssue>();
        if (string.IsNullOrWhiteSpace(content)) return issues;

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(content);
        }
        catch (JsonException)
        {
            return issues; // 舊的純文字／HTML 內容，不檢查
        }

        using (document)
        {
            if (document.RootElement.ValueKind != JsonValueKind.Object ||
                !document.RootElement.TryGetProperty("content", out var blocks) ||
                blocks.ValueKind != JsonValueKind.Array)
                return issues;

            var list = blocks.EnumerateArray().ToList();

            // ---- 規則 1：標題不能跳級（依區塊順序，從文章標題 H2 往下接）----
            var previous = PageTitleLevel;
            for (var i = 0; i < list.Count; i++)
            {
                foreach (var level in HeadingsOf(list[i]))
                {
                    if (level > previous + 1)
                    {
                        issues.Add(new ArticleContentIssue("error", i + 1, LabelOf(list[i]),
                            $"標題是 H{level}，但前面最近的標題是 H{previous}，不能跳級。請把標題層級改成 H2～H{previous + 1} 之間（文章本身的標題是 H2）。"));
                    }
                    previous = level;
                }
            }

            for (var i = 0; i < list.Count; i++)
            {
                var block = list[i];
                var type = TypeOf(block);
                var props = PropsOf(block);

                // ---- 規則 0：還留著編輯器元件的預設範例文字（關鍵字偵測）----
                var placeholderHit = false;
                foreach (var keyword in PlaceholderKeywords)
                {
                    if (!ContainsText(block, keyword)) continue;
                    placeholderHit = true;
                    issues.Add(new ArticleContentIssue("error", i + 1, LabelOf(block),
                        $"還留著編輯器的預設範例文字「{keyword}」，請改成真正的內容（圖片請填能描述這張圖的替代文字）。"));
                }

                // ---- 規則 2：圖片一定要有替代文字（唯一必填欄位；「顯示圖說」只是把它顯示在圖片下方）----
                // 舊內容有獨立的圖片說明（imageCaption），前台會拿它當替代文字，所以也算有；兩個都沒有才是錯誤
                if (type == "ImageFeature")
                {
                    var alt = Text(props, "alt");
                    var hasAlt = alt.Length > 0 && alt != SampleAlt;
                    var hasLegacyCaption = Text(props, "imageCaption").Length > 0;
                    // 已經因為留著範例文字報過錯的區塊不再重複報「沒有替代文字」
                    if (!hasAlt && !hasLegacyCaption && !placeholderHit)
                        issues.Add(new ArticleContentIssue("error", i + 1, LabelOf(block), "圖片沒有替代文字。請填「替代文字」，用一句話說明這張圖的內容；想在圖片下方顯示成圖說，打開「顯示圖說」。"));
                }

                // ---- 規則 3：連結文字要能說明去哪裡（只提醒）----
                var linkTexts = new List<string>();
                if (type == "RelatedLinks" && props.HasValue && props.Value.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                {
                    var seen = new Dictionary<string, string>();
                    foreach (var item in items.EnumerateArray())
                    {
                        var text = item.ValueKind == JsonValueKind.Object ? Text(item, "title") : "";
                        var url = item.ValueKind == JsonValueKind.Object ? Text(item, "url") : "";
                        linkTexts.Add(text);
                        if (text.Length == 0) continue;
                        if (seen.TryGetValue(text, out var prevUrl) && prevUrl != url)
                            issues.Add(new ArticleContentIssue("warning", i + 1, LabelOf(block), $"有兩個連結都叫「{text}」但網址不同，讀螢幕閱讀器的人分不出差別，請改成不同的名稱。"));
                        seen[text] = url;
                    }
                }
                if (type == "NavigationCard") linkTexts.Add(Text(props, "linkText"));
                if (type == "CallToAction")
                {
                    linkTexts.Add(Text(props, "primaryButtonText"));
                    linkTexts.Add(Text(props, "secondaryButtonText"));
                }
                foreach (var text in linkTexts.Where(t => t.Length > 0 && GenericLinkTexts.Contains(t)))
                    issues.Add(new ArticleContentIssue("warning", i + 1, LabelOf(block), $"連結文字「{text}」看不出要去哪裡，請改成能單獨說明目的的文字，例如「下載申請須知」。"));
            }
        }

        return issues;
    }

    /// <summary>這個區塊會輸出哪些「自己的標題」（層級依出現順序）；沒填標題的不輸出（前台也不會輸出空標題）</summary>
    private static List<int> HeadingsOf(JsonElement block)
    {
        var props = PropsOf(block);
        var levels = new List<int>();
        switch (TypeOf(block))
        {
            case "HeroBlock":
                if (Text(props, "title").Length > 0) levels.Add(LevelOf(Text(props, "headingLevel"), 2));
                break;
            case "FeatureList":
                if (Text(props, "heading").Length > 0) levels.Add(LevelOf(Text(props, "headingLevel"), 2));
                if (props.HasValue && props.Value.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in items.EnumerateArray())
                        if (item.ValueKind == JsonValueKind.Object && Text(item, "title").Length > 0) levels.Add(3);
                }
                break;
            case "CallToAction":
                if (Text(props, "heading").Length > 0) levels.Add(2);
                break;
            // 附件下載／相關連結／聯絡資訊共用藍框，標題沒填時前台會用預設文字，一律輸出 H2
            case "FileDownloads":
            case "RelatedLinks":
            case "ContactInfo":
                levels.Add(2);
                break;
        }
        return levels;
    }

    /// <summary>這個 JSON 節點底下（含所有巢狀的物件、陣列）有沒有任何文字欄位包含指定文字</summary>
    private static bool ContainsText(JsonElement element, string text) => element.ValueKind switch
    {
        JsonValueKind.String => element.GetString()?.Contains(text, StringComparison.Ordinal) == true,
        JsonValueKind.Object => element.EnumerateObject().Any(p => ContainsText(p.Value, text)),
        JsonValueKind.Array => element.EnumerateArray().Any(item => ContainsText(item, text)),
        _ => false,
    };

    private static int LevelOf(string value, int fallback) =>
        value.Length == 2 && (value[0] == 'h' || value[0] == 'H') && value[1] is >= '1' and <= '6' ? value[1] - '0' : fallback;

    private static string TypeOf(JsonElement block) =>
        block.ValueKind == JsonValueKind.Object && block.TryGetProperty("type", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() ?? "" : "";

    private static JsonElement? PropsOf(JsonElement block) =>
        block.ValueKind == JsonValueKind.Object && block.TryGetProperty("props", out var p) && p.ValueKind == JsonValueKind.Object ? p : null;

    private static string LabelOf(JsonElement block)
    {
        var type = TypeOf(block);
        return BlockLabels.TryGetValue(type, out var label) ? label : (type.Length > 0 ? type : "區塊");
    }

    private static string Text(JsonElement? element, string name) =>
        element.HasValue ? Text(element.Value, name) : "";

    private static string Text(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
            ? (v.GetString() ?? "").Trim()
            : "";
}
