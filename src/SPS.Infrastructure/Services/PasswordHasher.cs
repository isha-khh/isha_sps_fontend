using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 密碼哈希服務實現（使用 Argon2id）
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 4;
    private const int MemorySize = 65536; // 64 MB
    private const int DegreeOfParallelism = 2;

    /// <summary>
    /// 哈希密碼
    /// </summary>
    public string Hash(string password)
    {
        // 生成隨機鹽值
        var salt = RandomNumberGenerator.GetBytes(SaltSize);

        // 使用 Argon2id 哈希密碼
        var hash = HashPassword(password, salt);

        // 組合 鹽值 + 哈希值，並轉為 Base64
        var hashBytes = new byte[SaltSize + HashSize];
        Buffer.BlockCopy(salt, 0, hashBytes, 0, SaltSize);
        Buffer.BlockCopy(hash, 0, hashBytes, SaltSize, HashSize);

        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// 驗證密碼
    /// </summary>
    public bool Verify(string password, string hash)
    {
        try
        {
            // 從 Base64 解碼
            var hashBytes = Convert.FromBase64String(hash);

            // 提取鹽值
            var salt = new byte[SaltSize];
            Buffer.BlockCopy(hashBytes, 0, salt, 0, SaltSize);

            // 提取存儲的哈希值
            var storedHash = new byte[HashSize];
            Buffer.BlockCopy(hashBytes, SaltSize, storedHash, 0, HashSize);

            // 使用相同的鹽值計算哈希
            var computedHash = HashPassword(password, salt);

            // 比較兩個哈希值
            return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 使用 Argon2id 計算密碼哈希
    /// </summary>
    private static byte[] HashPassword(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySize,
            Iterations = Iterations
        };

        return argon2.GetBytes(HashSize);
    }
}