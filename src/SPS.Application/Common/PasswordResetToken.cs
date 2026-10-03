using System.Security.Cryptography;
using System.Text;

namespace SPS.Application.Common;

/// <summary>
/// 驗證通過的密碼重置令牌內容：誰的、以及簽發當下那組密碼的指紋
/// </summary>
/// <param name="SubjectId">後台使用者或會員的 id</param>
/// <param name="PasswordStamp">簽發令牌當下密碼雜湊的指紋；舊版令牌沒有這個值（null）</param>
public sealed record PasswordResetTokenInfo(Guid SubjectId, string? PasswordStamp);

/// <summary>
/// 讓密碼重置連結「用過一次就失效」，又不需要額外存放已使用的令牌：
/// 令牌簽發時把「當時密碼雜湊的指紋」寫進去，驗證時和目前的密碼雜湊重新比對。
/// 密碼一旦改過（用這個連結重設、或之後自己改密碼）指紋就變了，所有舊的重置連結一併失效。
/// 指紋是雜湊再雜湊，令牌外洩不會洩漏密碼雜湊本身。
/// </summary>
public static class PasswordStamp
{
    public static string Compute(string passwordHash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..32].ToLowerInvariant();

    /// <summary>
    /// 令牌上的指紋是否和目前密碼雜湊一致（常數時間比較）。沒有指紋的舊版令牌一律視為無效，
    /// 使用者重新申請即可（重置令牌本來就只有 30 分鐘）
    /// </summary>
    public static bool Matches(string? tokenStamp, string currentPasswordHash)
    {
        if (string.IsNullOrEmpty(tokenStamp)) return false;
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(tokenStamp),
            Encoding.UTF8.GetBytes(Compute(currentPasswordHash)));
    }
}
