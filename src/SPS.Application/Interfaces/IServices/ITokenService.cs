using SPS.Application.DTOs.Auth;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// Token 服務接口
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// 生成會員訪問令牌
    /// </summary>
    TokenResponse GenerateToken(Member member);

    /// <summary>
    /// 生成後台使用者訪問令牌
    /// </summary>
    AdminTokenResponse GenerateAdminToken(User user);

    /// <summary>
    /// 驗證令牌
    /// </summary>
    bool ValidateToken(string token);

    /// <summary>
    /// 生成刷新令牌
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// 從令牌中獲取會員ID
    /// </summary>
    Guid? GetMemberIdFromToken(string token);

    /// <summary>
    /// 從令牌中獲取使用者ID
    /// </summary>
    Guid? GetUserIdFromToken(string token);

    /// <summary>
    /// 生成密碼重置令牌
    /// </summary>
    string GeneratePasswordResetToken(Guid userId, string email);

    /// <summary>
    /// 驗證密碼重置令牌並返回使用者ID
    /// </summary>
    Guid? ValidatePasswordResetToken(string token);

    /// <summary>
    /// 生成會員密碼重置令牌
    /// </summary>
    string GenerateMemberPasswordResetToken(Guid memberId, string email);

    /// <summary>
    /// 驗證會員密碼重置令牌並返回會員ID
    /// </summary>
    Guid? ValidateMemberPasswordResetToken(string token);
}
