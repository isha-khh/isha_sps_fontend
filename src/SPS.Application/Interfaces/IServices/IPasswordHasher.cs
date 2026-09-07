namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 密碼哈希服務接口
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// 哈希密碼
    /// </summary>
    string Hash(string password);

    /// <summary>
    /// 驗證密碼
    /// </summary>
    bool Verify(string password, string hash);
}
