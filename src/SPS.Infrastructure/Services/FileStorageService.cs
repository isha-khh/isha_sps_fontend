using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.Interfaces.IServices;
using System.Security.Cryptography;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 文件存儲服務實現（本地存儲）
/// </summary>
public class FileStorageService : IFileStorageService
{
    private readonly string _uploadPath;
    private readonly ILogger<FileStorageService> _logger;
    private static readonly string[] DefaultAllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
    private const int DefaultMaxSizeInMb = 10;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _uploadPath = configuration["FileStorage:UploadPath"] ?? "Uploads";
        _logger = logger;

        // 確保上傳目錄存在
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
            _logger.LogInformation("Created upload directory at {UploadPath}", _uploadPath);
        }
    }

    public async Task<Result<FileUploadResult>> UploadFileAsync(
        IFormFile file,
        string directory,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 驗證文件
            var validationResult = ValidateFile(file);
            if (!validationResult.IsSuccess)
            {
                return Result<FileUploadResult>.Failure(validationResult.Error!);
            }

            // 創建目標目錄
            var targetDirectory = Path.Combine(_uploadPath, directory);
            if (!Directory.Exists(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }

            // 生成唯一文件名
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var relativePath = Path.Combine(directory, uniqueFileName);
            var fullPath = Path.Combine(_uploadPath, relativePath);

            // 保存文件
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            // 計算文件哈希
            var fileHash = await CalculateFileHashAsync(file, cancellationToken);

            _logger.LogInformation("Uploaded file {FileName} to {RelativePath}", file.FileName, relativePath);

            return Result<FileUploadResult>.Success(new FileUploadResult
            {
                FilePath = relativePath.Replace("\\", "/"), // 統一使用正斜杠
                FileName = file.FileName,
                FileSize = file.Length,
                FileHash = fileHash,
                ContentType = file.ContentType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file {FileName}", file.FileName);
            return Result<FileUploadResult>.Failure($"文件上傳失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var fullPath = GetFullPath(filePath);

            if (!File.Exists(fullPath))
            {
                return Result<bool>.Failure("文件不存在");
            }

            await Task.Run(() => File.Delete(fullPath), cancellationToken);

            _logger.LogInformation("Deleted file at {FilePath}", filePath);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FilePath}", filePath);
            return Result<bool>.Failure($"刪除文件失敗: {ex.Message}");
        }
    }

    public string GetFullPath(string relativePath)
    {
        return Path.Combine(_uploadPath, relativePath);
    }

    public Result<bool> ValidateFile(
        IFormFile file,
        int maxSizeInMb = DefaultMaxSizeInMb,
        string[]? allowedExtensions = null)
    {
        if (file == null || file.Length == 0)
        {
            return Result<bool>.Failure("文件不能為空");
        }

        // 驗證文件大小
        var maxSizeInBytes = maxSizeInMb * 1024 * 1024;
        if (file.Length > maxSizeInBytes)
        {
            return Result<bool>.Failure($"文件大小不能超過 {maxSizeInMb}MB");
        }

        // 驗證文件擴展名
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var extensions = allowedExtensions ?? DefaultAllowedExtensions;

        if (!extensions.Contains(fileExtension))
        {
            return Result<bool>.Failure($"不支持的文件格式。允許的格式: {string.Join(", ", extensions)}");
        }

        return Result<bool>.Success(true);
    }

    public async Task<string> CalculateFileHashAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        using var sha256 = SHA256.Create();
        using var stream = file.OpenReadStream();
        var hashBytes = await sha256.ComputeHashAsync(stream, cancellationToken);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    public async Task<int> CleanupExpiredFilesAsync(DateTime expirationDate, CancellationToken cancellationToken = default)
    {
        try
        {
            var deletedCount = 0;
            var directories = Directory.GetDirectories(_uploadPath);

            foreach (var directory in directories)
            {
                var files = Directory.GetFiles(directory);

                foreach (var file in files)
                {
                    var fileInfo = new FileInfo(file);

                    if (fileInfo.LastWriteTime < expirationDate)
                    {
                        await Task.Run(() => File.Delete(file), cancellationToken);
                        deletedCount++;
                    }
                }
            }

            _logger.LogInformation("Cleaned up {DeletedCount} expired files", deletedCount);

            return deletedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up expired files");
            return 0;
        }
    }
}
