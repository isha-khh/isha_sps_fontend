using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Common;

/// <summary>
/// 前台徽章（分類、標籤）的顏色設定，後台「分類管理／標籤管理」維護。
/// 三個顏色都是選填的 <c>#RRGGBB</c>；沒設定的欄位前台套用預設樣式。
/// </summary>
public class BadgeStyleDto
{
    public string? BadgeColor { get; set; }
    public string? BadgeTextColor { get; set; }
    public string? BadgeBorderColor { get; set; }

    /// <summary>三個顏色都沒設定時回傳 null，讓前台 JSON 乾淨一點</summary>
    public static BadgeStyleDto? From(string? color, string? textColor, string? borderColor)
        => string.IsNullOrEmpty(color) && string.IsNullOrEmpty(textColor) && string.IsNullOrEmpty(borderColor)
            ? null
            : new BadgeStyleDto { BadgeColor = color, BadgeTextColor = textColor, BadgeBorderColor = borderColor };
}

/// <summary>徽章顏色格式驗證：空值（不設定／清除）或 <c>#RRGGBB</c></summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class BadgeColorAttribute : ValidationAttribute
{
    public BadgeColorAttribute() : base("顏色格式必須是 #RRGGBB（例如 #A333C8）") { }

    public override bool IsValid(object? value)
        => value is null or "" || (value is string s && IsHexColor(s));

    public static bool IsHexColor(string s)
        => s.Length == 7 && s[0] == '#' && s.Skip(1).All(Uri.IsHexDigit);

    /// <summary>
    /// 更新時套用顏色：null＝不變、空字串＝清除、其餘轉成大寫 <c>#RRGGBB</c>。
    /// </summary>
    public static string? Apply(string? incoming, string? current)
        => incoming == null ? current : incoming.Length == 0 ? null : incoming.ToUpperInvariant();
}
