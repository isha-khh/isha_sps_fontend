using Microsoft.AspNetCore.Http;
using SPS.Application.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 文件存儲服務接口
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// 上傳文件
    /// </summary>
    /// <param name="file">文件</param>
    /// <param name="directory">存儲目錄</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件路徑和哈希</returns>
    Task<Result<FileUploadResult>> UploadFileAsync(
        IFormFile file,
        string directory,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除文件
    /// </summary>
    Task<Result<bool>> DeleteFileAsync(
        string filePath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取文件完整路徑
    /// </summary>
    string GetFullPath(string relativePath);

    /// <summary>
    /// 驗證文件
    /// </summary>
    /// <param name="file">文件</param>
    /// <param name="maxSizeInMb">最大文件大小（MB）</param>
    /// <param name="allowedExtensions">允許的擴展名</param>
    /// <returns>驗證結果</returns>
    Result<bool> ValidateFile(
        IFormFile file,
        int maxSizeInMb = 10,
        string[]? allowedExtensions = null);

    /// <summary>
    /// 計算文件SHA256哈希
    /// </summary>
    Task<string> CalculateFileHashAsync(
        IFormFile file,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 清理過期文件
    /// </summary>
    Task<int> CleanupExpiredFilesAsync(
        DateTime expirationDate,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// 文件上傳結果
/// </summary>
public class FileUploadResult
{
    /// <summary>
    /// 文件相對路徑
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// 文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字節）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 文件哈希（SHA256）
    /// </summary>
    public string FileHash { get; set; } = string.Empty;

    /// <summary>
    /// MIME類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;
}
