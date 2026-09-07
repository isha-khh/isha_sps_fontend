namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 刷新令牌請求
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// 刷新令牌
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}
