using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SPS.Application.DTOs.Auth;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Infrastructure.Services;

/// <summary>
/// Token 服務實現
/// </summary>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// 生成訪問令牌
    /// </summary>
    public TokenResponse GenerateToken(Member member)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, member.Id.ToString()),
            new Claim(ClaimTypes.Email, member.Email),
            new Claim(ClaimTypes.Name, member.Nickname ?? member.Email),
            new Claim("MemberId", member.Id.ToString()),
            new Claim(ClaimTypes.Role, member.Role.ToString())
        };

        // 添加權限
        claims.Add(new Claim("Permissions", ((long)member.Permissions).ToString()));
        claims.Add(new Claim("MemberPosition", ((int)member.MemberPosition).ToString()));
        claims.Add(new Claim("MemberRole", ((int)member.Role).ToString()));

        // 添加企業ID（如果有）
        if (member.CompanyId.HasValue)
        {
            claims.Add(new Claim("CompanyId", member.CompanyId.Value.ToString()));
        }

        // 添加企業名稱（如果有）
        if (member.Company != null)
        {
            claims.Add(new Claim("CompanyName", member.Company.Name));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresMinutes = int.Parse(_configuration["JWT_Setting:Expires"] ?? "1440");
        var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT_Setting:Issuer"],
            audience: _configuration["JWT_Setting:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // 生成 RefreshToken
        var refreshToken = GenerateRefreshToken();

        return new TokenResponse
        {
            AccessToken = tokenString,
            TokenType = "Bearer",
            ExpiresAt = expires,
            RefreshToken = refreshToken,
            Member = new MemberInfo
            {
                Id = member.Id,
                Email = member.Email,
                Name = member.Nickname ?? member.Email,
                Phone = member.Phone,
                Extension = member.Extension,
                MobilePhone = member.MobilePhone,
                CompanyId = member.CompanyId,
                CompanyName = member.Company?.Name
            }
        };
    }

    /// <summary>
    /// 驗證令牌
    /// </summary>
    public bool ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured"));

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["JWT_Setting:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JWT_Setting:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 生成刷新令牌
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    /// <summary>
    /// 從令牌中獲取會員ID
    /// </summary>
    public Guid? GetMemberIdFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);
            var memberIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "MemberId");

            if (memberIdClaim != null && Guid.TryParse(memberIdClaim.Value, out var memberId))
            {
                return memberId;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 生成後台使用者訪問令牌
    /// </summary>
    public AdminTokenResponse GenerateAdminToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim("UserId", user.Id.ToString()),
            new Claim("Account", user.Account),
            new Claim("UserType", "Admin")
        };

        // 添加郵箱（如果有）
        if (!string.IsNullOrEmpty(user.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        }

        // 計算所有角色的組合權限
        var combinedPermissions = UserPermission.None;
        var roleInfos = new List<RoleInfo>();

        if (user.UserRoles != null && user.UserRoles.Any())
        {
            foreach (var userRole in user.UserRoles)
            {
                if (userRole.Role != null)
                {
                    combinedPermissions |= userRole.Role.Permissions;
                    claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));

                    roleInfos.Add(new RoleInfo
                    {
                        Id = userRole.Role.Id,
                        Name = userRole.Role.Name,
                        Description = userRole.Role.Description,
                        Permissions = userRole.Role.Permissions
                    });
                }
            }
        }

        // 添加權限到 Claims
        claims.Add(new Claim("Permissions", ((long)combinedPermissions).ToString()));

        // 所有後台使用者都有 Admin 角色
        claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        // 根據權限映射虛擬角色 (用於 [Authorize(Roles = "...")] )
        // SuperAdmin: 擁有三大核心管理權限（ManageUsers + ManageRoles + ManageSettings）
        var coreAdminPermissions = UserPermission.ManageUsers | UserPermission.ManageRoles | UserPermission.ManageSettings;
        if ((combinedPermissions & coreAdminPermissions) == coreAdminPermissions)
        {
            claims.Add(new Claim(ClaimTypes.Role, "SuperAdmin"));
        }

        if (combinedPermissions.HasFlag(UserPermission.ManageApplications))
        {
            claims.Add(new Claim(ClaimTypes.Role, "Reviewer"));
        }

        if (combinedPermissions.HasFlag(UserPermission.ManageSettings))
        {
            claims.Add(new Claim(ClaimTypes.Role, "SettingsAdmin"));
        }

        if (combinedPermissions.HasFlag(UserPermission.CustomerService))
        {
            claims.Add(new Claim(ClaimTypes.Role, "CustomerService"));
        }

        if (combinedPermissions.HasFlag(UserPermission.ViewAnalytics))
        {
            claims.Add(new Claim(ClaimTypes.Role, "AnalyticsViewer"));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresMinutes = int.Parse(_configuration["JWT_Setting:Expires"] ?? "1440");
        var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT_Setting:Issuer"],
            audience: _configuration["JWT_Setting:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // 生成 RefreshToken
        var refreshToken = GenerateRefreshToken();

        // 構建頭像 URL
        string? avatarUrl = null;
        if (user.AvatarFileId.HasValue)
        {
            avatarUrl = $"/api/FileManagement/{user.AvatarFileId}/download";
        }

        return new AdminTokenResponse
        {
            AccessToken = tokenString,
            TokenType = "Bearer",
            ExpiresAt = expires,
            RefreshToken = refreshToken,
            User = new AdminUserInfo
            {
                Id = user.Id,
                Name = user.Name,
                Account = user.Account,
                Email = user.Email,
                AvatarFileId = user.AvatarFileId,
                AvatarUrl = avatarUrl,
                Roles = roleInfos,
                Permissions = combinedPermissions
            }
        };
    }

    /// <summary>
    /// 從令牌中獲取使用者ID
    /// </summary>
    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);
            var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "UserId");

            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 生成密碼重置令牌（有效期 30 分鐘）
    /// </summary>
    public string GeneratePasswordResetToken(Guid userId, string email)
    {
        var claims = new List<Claim>
        {
            new Claim("UserId", userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim("Purpose", "PasswordReset"),
            new Claim("TokenId", Guid.NewGuid().ToString()) // 確保每次生成的 Token 都是唯一的
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 重置密碼 Token 有效期 30 分鐘
        var expires = DateTime.UtcNow.AddMinutes(30);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT_Setting:Issuer"],
            audience: _configuration["JWT_Setting:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 驗證密碼重置令牌並返回使用者ID
    /// </summary>
    public Guid? ValidatePasswordResetToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured"));

            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["JWT_Setting:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JWT_Setting:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out var validatedToken);

            // 確認是密碼重置 Token
            var purposeClaim = principal.FindFirst("Purpose");
            if (purposeClaim?.Value != "PasswordReset")
            {
                return null;
            }

            var userIdClaim = principal.FindFirst("UserId");
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 生成會員密碼重置令牌（有效期 30 分鐘）
    /// </summary>
    public string GenerateMemberPasswordResetToken(Guid memberId, string email)
    {
        var claims = new List<Claim>
        {
            new Claim("MemberId", memberId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim("Purpose", "MemberPasswordReset"),
            new Claim("TokenId", Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 重置密碼 Token 有效期 30 分鐘
        var expires = DateTime.UtcNow.AddMinutes(30);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT_Setting:Issuer"],
            audience: _configuration["JWT_Setting:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 驗證會員密碼重置令牌並返回會員ID
    /// </summary>
    public Guid? ValidateMemberPasswordResetToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JWT_Setting:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured"));

            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["JWT_Setting:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JWT_Setting:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out var validatedToken);

            // 確認是會員密碼重置 Token
            var purposeClaim = principal.FindFirst("Purpose");
            if (purposeClaim?.Value != "MemberPasswordReset")
            {
                return null;
            }

            var memberIdClaim = principal.FindFirst("MemberId");
            if (memberIdClaim != null && Guid.TryParse(memberIdClaim.Value, out var memberId))
            {
                return memberId;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }
}