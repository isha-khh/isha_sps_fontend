namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 授權簽章（私鑰在 Cloud KMS，永遠不出 KMS）。簽章演算法固定為 ECDSA P-256 + SHA-256，
/// <b>回傳 IEEE P1363（r‖s，64 位元組）</b>，與 .NET 預設的驗證格式一致。
/// </summary>
public interface ILicenseSigner
{
    /// <summary>用指定的 KMS 金鑰版本簽章（簽的是資料的 SHA-256）</summary>
    Task<byte[]> SignAsync(string kmsKeyVersion, byte[] data, CancellationToken cancellationToken = default);

    /// <summary>向 KMS 取回公鑰（SubjectPublicKeyInfo base64），並確認金鑰演算法是 EC_SIGN_P256_SHA256；不是就丟例外</summary>
    Task<string> GetPublicKeyAsync(string kmsKeyVersion, CancellationToken cancellationToken = default);
}
