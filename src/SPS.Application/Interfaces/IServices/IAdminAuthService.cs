using SPS.Application.Common;
using SPS.Application.DTOs.Auth;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 後台管理員認證服務接口
/// </summary>
public interface IAdminAuthService
{
    /// <summary>
    /// 檢查系統是否需要初始化
    /// </summary>
    Task<Result<SystemInitResponse>> CheckInitAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 註冊首個系統管理員（僅在沒有任何使用者時可用）
    /// </summary>
    Task<Result<AdminTokenResponse>> RegisterFirstAdminAsync(AdminRegisterRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 後台管理員登入
    /// </summary>
    Task<Result<AdminTokenResponse>> LoginAsync(AdminLoginRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刷新令牌
    /// </summary>
    Task<Result<AdminTokenResponse>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// 修改密碼
    /// </summary>
    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 忘記密碼 - 發送重置密碼郵件
    /// </summary>
    Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// 重置密碼 - 透過 Token 設定新密碼
    /// </summary>
    Task<Result> ResetPasswordAsync(AdminResetPasswordRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證重置密碼 Token 是否有效
    /// </summary>
    Task<Result<string>> ValidateResetTokenAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取使用者資訊（包含頭像）
    /// </summary>
    Task<Result<AdminUserInfo>> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新頭像
    /// </summary>
    Task<Result<AdminUserInfo>> UpdateAvatarAsync(Guid userId, Guid? fileId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新個人資料
    /// </summary>
    Task<Result<AdminUserInfo>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
}