namespace SPS.Application.DTOs.SystemSettings;

/// <summary>
/// 密碼策略設定
/// </summary>
public class PasswordPolicyDto
{
    /// <summary>
    /// 最小密碼長度
    /// </summary>
    public int MinLength { get; set; } = 8;

    /// <summary>
    /// 是否需要大寫字母
    /// </summary>
    public bool RequireUppercase { get; set; } = true;

    /// <summary>
    /// 是否需要小寫字母
    /// </summary>
    public bool RequireLowercase { get; set; } = true;

    /// <summary>
    /// 是否需要數字
    /// </summary>
    public bool RequireDigit { get; set; } = true;

    /// <summary>
    /// 是否需要特殊字符
    /// </summary>
    public bool RequireSpecialCharacter { get; set; } = false;

    /// <summary>
    /// 密碼歷史記錄數量（不可重複使用前 N 組密碼，0 表示不限制）
    /// </summary>
    public int PasswordHistoryCount { get; set; } = 0;
}
