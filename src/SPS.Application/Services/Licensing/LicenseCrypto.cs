using System.Formats.Asn1;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;

namespace SPS.Application.Services.Licensing;

/// <summary>
/// 授權檔用到的密碼學小工具（純函式，不依賴資料庫與 KMS，方便測試）。
/// 簽章：ECDSA P-256 + SHA-256，<b>簽章編碼固定為 IEEE P1363（r‖s，共 64 位元組）</b>——
/// .NET 預設的 <c>ECDsa.VerifyData</c> 就是這個格式；Cloud KMS 回傳的是 DER，要先用 <see cref="DerToP1363"/> 轉換。
/// </summary>
public static class LicenseCrypto
{
    public const int CoordinateLength = 32;

    public static string Base64UrlEncode(ReadOnlySpan<byte> data)
        => Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static byte[] Base64UrlDecode(string text)
    {
        var s = text.Trim().Replace('-', '+').Replace('_', '/');
        s = s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=');
        return Convert.FromBase64String(s);
    }

    public static string Sha256Hex(string text) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();

    /// <summary>把 DER（SEQUENCE { INTEGER r, INTEGER s }）轉成固定長度的 r‖s（各補零到 32 位元組）</summary>
    public static byte[] DerToP1363(byte[] der)
    {
        var reader = new AsnReader(der, AsnEncodingRules.DER);
        var sequence = reader.ReadSequence();
        var r = ToFixedLength(sequence.ReadInteger());
        var s = ToFixedLength(sequence.ReadInteger());
        sequence.ThrowIfNotEmpty();
        reader.ThrowIfNotEmpty();

        var result = new byte[CoordinateLength * 2];
        r.CopyTo(result, 0);
        s.CopyTo(result, CoordinateLength);
        return result;
    }

    private static byte[] ToFixedLength(BigInteger value)
    {
        if (value.Sign < 0) throw new CryptographicException("簽章的 r／s 不可為負數");
        var bytes = value.ToByteArray(isUnsigned: true, isBigEndian: true);
        if (bytes.Length > CoordinateLength) throw new CryptographicException("簽章的 r／s 超過 32 位元組");
        var padded = new byte[CoordinateLength];
        bytes.CopyTo(padded, CoordinateLength - bytes.Length);
        return padded;
    }

    /// <summary>用 SubjectPublicKeyInfo（base64）驗證 P1363 簽章；任何錯誤（格式、金鑰）一律回 false</summary>
    public static bool Verify(string spkiBase64, byte[] data, byte[] signatureP1363)
    {
        try
        {
            if (signatureP1363.Length != CoordinateLength * 2) return false;
            using var ecdsa = ECDsa.Create();
            ecdsa.ImportSubjectPublicKeyInfo(Convert.FromBase64String(spkiBase64), out _);
            return ecdsa.VerifyData(data, signatureP1363, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException or ArgumentException)
        {
            return false;
        }
    }

    /// <summary>把 PEM 公鑰（Cloud KMS 回傳的格式）轉成 SubjectPublicKeyInfo base64，並確認是 P-256 曲線</summary>
    public static string PemToSpkiBase64(string pem)
    {
        using var ecdsa = ECDsa.Create();
        ecdsa.ImportFromPem(pem);
        var parameters = ecdsa.ExportParameters(false);
        if (parameters.Curve.Oid?.Value != "1.2.840.10045.3.1.7" && parameters.Curve.Oid?.FriendlyName != "nistP256" && parameters.Curve.Oid?.FriendlyName != "ECDSA_P256")
            throw new CryptographicException("公鑰不是 P-256 曲線（需要 EC_SIGN_P256_SHA256）");
        return Convert.ToBase64String(ecdsa.ExportSubjectPublicKeyInfo());
    }
}
