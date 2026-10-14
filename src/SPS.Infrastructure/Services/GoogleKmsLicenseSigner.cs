using System.Security.Cryptography;
using Google.Cloud.Kms.V1;
using Google.Protobuf;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services.Licensing;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 用 Google Cloud KMS 簽章授權檔。私鑰永遠在 KMS，後端只送出資料的 SHA-256 請 KMS 簽章。
/// 認證用 Google 預設認證（Application Default Credentials）：GCP 上的主機用 VM／服務帳號；
/// 其他環境（例如測試機）把服務帳號金鑰檔路徑放在環境變數 <c>GOOGLE_APPLICATION_CREDENTIALS</c>。
/// 服務帳號需要 <c>Cloud KMS CryptoKey Signer</c>（簽章）與 <c>Cloud KMS Public Key Viewer</c>（讀公鑰）權限。
/// </summary>
public class GoogleKmsLicenseSigner : ILicenseSigner
{
    private readonly Lazy<Task<KeyManagementServiceClient>> _client = new(() => new KeyManagementServiceClientBuilder().BuildAsync());

    public async Task<byte[]> SignAsync(string kmsKeyVersion, byte[] data, CancellationToken cancellationToken = default)
    {
        var client = await _client.Value;
        var digest = SHA256.HashData(data);
        var response = await client.AsymmetricSignAsync(new AsymmetricSignRequest
        {
            Name = kmsKeyVersion,
            Digest = new Digest { Sha256 = ByteString.CopyFrom(digest) },
        }, cancellationToken);

        // KMS 回傳 DER 編碼的簽章；對外規格是 IEEE P1363（r‖s）
        return LicenseCrypto.DerToP1363(response.Signature.ToByteArray());
    }

    public async Task<string> GetPublicKeyAsync(string kmsKeyVersion, CancellationToken cancellationToken = default)
    {
        var client = await _client.Value;
        var publicKey = await client.GetPublicKeyAsync(new GetPublicKeyRequest { Name = kmsKeyVersion }, cancellationToken);
        if (publicKey.Algorithm != CryptoKeyVersion.Types.CryptoKeyVersionAlgorithm.EcSignP256Sha256)
            throw new InvalidOperationException($"金鑰演算法是 {publicKey.Algorithm}，必須是 EC_SIGN_P256_SHA256");
        return LicenseCrypto.PemToSpkiBase64(publicKey.Pem);
    }
}
