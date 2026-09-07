using SPS.Application.Common;
using SPS.Application.DTOs.Auth;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 認證服務接口
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 會員登入
    /// </summary>
    Task<Result<TokenResponse>> LoginAsync(LoginRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 會員注冊
    /// </summary>
    Task<Result<TokenResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刷新令牌
    /// </summary>
    Task<Result<TokenResponse>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// 發送驗證碼
    /// </summary>
    Task<Result> SendVerificationCodeAsync(SendVerificationCodeRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 修改密碼（需驗證碼）
    /// </summary>
    Task<Result> ChangePasswordAsync(MemberChangePasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 忘記密碼 - 發送重置密碼郵件
    /// </summary>
    Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 重置密碼 - 透過 Token 設定新密碼
    /// </summary>
    Task<Result> ResetPasswordAsync(MemberResetPasswordRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證重置密碼 Token 是否有效
    /// </summary>
    Task<Result<string>> ValidateResetTokenAsync(string token, CancellationToken cancellationToken = default);
}
