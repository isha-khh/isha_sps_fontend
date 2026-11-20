namespace SPS.Application.DTOs.Auth;

/// <summary>
/// Token 響應
/// </summary>
public class TokenResponse
{
    /// <summary>
    /// 訪問令牌
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 令牌類型
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// 過期時間
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 刷新令牌（可選）
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// 是否需要修改密碼
    /// </summary>
    /// <remarks>
    /// 當此欄位為 true 時，前端應導向修改密碼頁面
    /// 可能原因：首次登入、密碼過期
    /// </remarks>
    public bool RequirePasswordChange { get; set; } = false;

    /// <summary>
    /// 需要修改密碼的原因
    /// </summary>
    public string? PasswordChangeReason { get; set; }

    /// <summary>
    /// 用戶信息
    /// </summary>
    public MemberInfo? Member { get; set; }
}

/// <summary>
/// 會員信息
/// </summary>
public class MemberInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }

    /// <summary>
    /// 是否需要先驗證信箱（信箱尚未驗證，且郵件服務有啟用——停用時寄不出驗證碼，不能把人擋在外面）。
    /// 登入（密碼、Passkey）與 <c>GET /api/Auth/profile</c> 會帶；前台據此導去「驗證信箱」頁。
    /// </summary>
    public bool RequireEmailVerification { get; set; }
}
