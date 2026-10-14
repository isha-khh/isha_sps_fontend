using System.Security.Cryptography;

namespace SPS.Application.Services.Licensing;

/// <summary>
/// 序號：<c>XR-XXXX-XXXX-XXXX-XXXX</c>，16 個字元取自 Crockford Base32（去掉容易混淆的 I、L、O、U），共 80 位元，
/// 隨機產生、無法推測。啟用時輸入的序號先 <see cref="Normalize"/>（大小寫、破折號、空白、易混淆字元）再算雜湊比對。
/// </summary>
public static class LicenseKeyGenerator
{
    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    public const string Prefix = "XR";
    private const int BodyLength = 16;

    /// <summary>產生新序號：回傳 (顯示用序號, 正規化後序號)</summary>
    public static (string Display, string Normalized) Generate()
    {
        var chars = new char[BodyLength];
        for (var i = 0; i < chars.Length; i++) chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        var body = new string(chars);
        return ($"{Prefix}-{body[..4]}-{body[4..8]}-{body[8..12]}-{body[12..]}", Prefix + body);
    }

    /// <summary>正規化使用者輸入的序號；格式不對回 null（呼叫端回 invalid_key）</summary>
    public static string? Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length > 64) return null;
        var chars = new List<char>(Prefix.Length + BodyLength);
        foreach (var raw in input.ToUpperInvariant())
        {
            if (raw is '-' or ' ' or '_') continue;
            var c = raw switch { 'O' => '0', 'I' => '1', 'L' => '1', _ => raw };
            chars.Add(c);
        }
        var text = new string(chars.ToArray());
        if (text.Length != Prefix.Length + BodyLength || !text.StartsWith(Prefix, StringComparison.Ordinal)) return null;
        // 前綴 XR 在上面的轉換中不受影響；本體必須都在字母表內
        return text[Prefix.Length..].All(c => Alphabet.Contains(c)) ? text : null;
    }

    /// <summary>遮罩顯示：<c>XR-****-****-****-AB12</c></summary>
    public static string Mask(string normalized) => $"{Prefix}-****-****-****-{normalized[^4..]}";
}
