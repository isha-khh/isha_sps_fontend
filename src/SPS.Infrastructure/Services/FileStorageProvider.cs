using System.Security.Cryptography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 文件存儲配置
/// </summary>
public class FileStorageSettings
{
    /// <summary>
    /// 根存儲路徑
    /// </summary>
    public string RootPath { get; set; } = "Uploads";

    /// <summary>
    /// 最大文件大小（字節），默認 100MB
    /// </summary>
    public long MaxFileSize { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// 允許的文件擴展名（逗號分隔），為空表示不限制
    /// </summary>
    public string? AllowedExtensions { get; set; }

    /// <summary>
    /// 是否啟用文件去重（基于哈希值）
    /// </summary>
    public bool EnableDeduplication { get; set; } = true;

    /// <summary>
    /// 緩衝區大小（用于文件讀寫）
    /// </summary>
    public int BufferSize { get; set; } = 81920; // 80KB

    /// <summary>
    /// Web 根目錄路徑（wwwroot）
    /// </summary>
    public string WebRootPath { get; set; } = "wwwroot";
}

/// <summary>
/// 本地文件存儲提供者實現
/// </summary>
public class LocalFileStorageProvider : IFileStorageProvider
{
    private readonly FileStorageSettings _defaultSettings;
    private readonly ILogger<LocalFileStorageProvider> _logger;
    private readonly ISystemSettingService _settingService;
    private readonly IWebHostEnvironment _environment;

    public LocalFileStorageProvider(
        IOptions<FileStorageSettings> settings,
        ILogger<LocalFileStorageProvider> logger,
        ISystemSettingService settingService,
        IWebHostEnvironment environment)
    {
        _defaultSettings = settings.Value;
        _logger = logger;
        _settingService = settingService;
        _environment = environment;
    }

    private async Task<string> GetRootPathAsync()
    {
        var path = _defaultSettings.RootPath;

        // 環境變數有明確設定時優先使用（基礎設施層級，不受 DB 覆蓋）
        var envPath = Environment.GetEnvironmentVariable("FileStorage__RootPath");
        if (string.IsNullOrWhiteSpace(envPath))
        {
            // 沒有環境變數時，嘗試 DB 設定
            var dbSettings = await _settingService.GetSettingAsync<FileStorageSettingsDto>("FileStorage");
            if (dbSettings.IsSuccess && !string.IsNullOrWhiteSpace(dbSettings.Data?.UploadPath))
            {
                path = dbSettings.Data.UploadPath;
            }
        }

        var fullPath = Path.GetFullPath(path);
        if (!Directory.Exists(fullPath))
        {
            Directory.CreateDirectory(fullPath);
        }
        return fullPath;
    }

    public async Task<(string StoragePath, string FileHash)> SaveFileAsync(
        Stream stream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var rootPath = await GetRootPathAsync();

            // 計算文件哈希值
            var fileHash = await ComputeFileHashAsync(stream, cancellationToken);
            stream.Position = 0; // 重置流位置

            // 生成存儲路徑（按日期分層：年/月/日/文件名）
            var now = DateTime.UtcNow;
            var relativePath = Path.Combine(
                now.Year.ToString(),
                now.Month.ToString("D2"),
                now.Day.ToString("D2"),
                $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}"
            );

            var fullPath = Path.Combine(rootPath, relativePath);
            var directory = Path.GetDirectoryName(fullPath);

            if (directory != null && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 保存文件
            await using var fileStream = new FileStream(
                fullPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                _defaultSettings.BufferSize,
                useAsync: true);

            await stream.CopyToAsync(fileStream, _defaultSettings.BufferSize, cancellationToken);
            await fileStream.FlushAsync(cancellationToken);

            _logger.LogInformation("File saved successfully: {RelativePath}, Hash: {FileHash}",
                relativePath, fileHash);

            return (relativePath, fileHash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<Stream> ReadFileAsync(
        string storagePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var rootPath = await GetRootPathAsync();
            var fullPath = Path.Combine(rootPath, storagePath);

            if (!File.Exists(fullPath))
            {
                // Fallback: 如果在新路徑找不到，試試看預設路徑 (應對遷移期間)
                var defaultRoot = Path.GetFullPath(_defaultSettings.RootPath);
                var fallbackPath = Path.Combine(defaultRoot, storagePath);
                if (File.Exists(fallbackPath))
                {
                    fullPath = fallbackPath;
                }
                else
                {
                    throw new FileNotFoundException($"File not found: {storagePath}");
                }
            }

            var memoryStream = new MemoryStream();
            await using var fileStream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                _defaultSettings.BufferSize,
                useAsync: true);

            await fileStream.CopyToAsync(memoryStream, _defaultSettings.BufferSize, cancellationToken);
            memoryStream.Position = 0;

            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading file: {StoragePath}", storagePath);
            throw;
        }
    }

    public Task DeleteFileAsync(
        string storagePath,
        CancellationToken cancellationToken = default)
    {
        // 刪除目前無法確定檔案在哪個 Root，這是一個潛在問題。
        // 不過因為我們是動態取得 Root，我們可以先試刪除目前的，如果失敗就算了，或者遍歷所有可能的 Root。
        // 暫時實作：只刪除目前設定 Root 下的檔案。
        try
        {
            // 這裡無法用 async await 因為介面定義是同步回傳 Task，我們需要用 .Result (不建議) 或修改介面
            // 為了不改動介面，我們先用 GetAwaiter().GetResult()
            var rootPath = GetRootPathAsync().GetAwaiter().GetResult();
            var fullPath = Path.Combine(rootPath, storagePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("File deleted: {StoragePath}", storagePath);
            }

            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {StoragePath}", storagePath);
            throw;
        }
    }

    public bool FileExists(string storagePath)
    {
        var rootPath = GetRootPathAsync().GetAwaiter().GetResult();
        var fullPath = Path.Combine(rootPath, storagePath);
        return File.Exists(fullPath);
    }

    public async Task<string> ComputeFileHashAsync(
        Stream stream,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var sha256 = SHA256.Create();
            var hashBytes = await sha256.ComputeHashAsync(stream, cancellationToken);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing file hash");
            throw;
        }
    }

    public string GetWebRootPath()
    {
        // 使用 IWebHostEnvironment 提供的 WebRootPath (只讀的系統靜態檔案目錄)
        // 若 WebRootPath 為空，則預設為 ContentRootPath/wwwroot
        return _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
    }

    public async Task<Stream> ReadStaticFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var webRootPath = GetWebRootPath();
            var fullPath = Path.Combine(webRootPath, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"Static file not found: {relativePath}");
            }

            var memoryStream = new MemoryStream();
            await using var fileStream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                _defaultSettings.BufferSize,
                useAsync: true);

            await fileStream.CopyToAsync(memoryStream, _defaultSettings.BufferSize, cancellationToken);
            memoryStream.Position = 0;

            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading static file: {RelativePath}", relativePath);
            throw;
        }
    }

    public async Task<List<StaticFileInfo>> ScanWebRootFilesAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<StaticFileInfo>();
        var webRootPath = GetWebRootPath();

        if (!Directory.Exists(webRootPath))
        {
            _logger.LogWarning("WebRoot path does not exist: {WebRootPath}", webRootPath);
            return result;
        }

        var files = Directory.GetFiles(webRootPath, "*.*", SearchOption.AllDirectories);

        foreach (var filePath in files)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                var fileInfo = new FileInfo(filePath);
                var relativePath = Path.GetRelativePath(webRootPath, filePath).Replace("\\", "/");
                var extension = fileInfo.Extension.ToLowerInvariant();
                var contentType = GetContentType(extension);

                // 計算檔案 Hash
                await using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                var fileHash = await ComputeFileHashAsync(stream, cancellationToken);

                result.Add(new StaticFileInfo
                {
                    RelativePath = relativePath,
                    FileName = fileInfo.Name,
                    Extension = extension,
                    FileSize = fileInfo.Length,
                    ContentType = contentType,
                    FileHash = fileHash
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error scanning file: {FilePath}", filePath);
            }
        }

        _logger.LogInformation("Scanned {Count} files from WebRoot: {WebRootPath}", result.Count, webRootPath);
        return result;
    }

    private static string GetContentType(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            ".ico" => "image/x-icon",
            ".bmp" => "image/bmp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".zip" => "application/zip",
            ".rar" => "application/x-rar-compressed",
            ".7z" => "application/x-7z-compressed",
            ".tar" => "application/x-tar",
            ".gz" => "application/gzip",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".mp4" => "video/mp4",
            ".avi" => "video/x-msvideo",
            ".mov" => "video/quicktime",
            ".webm" => "video/webm",
            ".html" or ".htm" => "text/html",
            ".css" => "text/css",
            ".js" => "application/javascript",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".md" => "text/markdown",
            ".woff" => "font/woff",
            ".woff2" => "font/woff2",
            ".ttf" => "font/ttf",
            ".otf" => "font/otf",
            ".eot" => "application/vnd.ms-fontobject",
            _ => "application/octet-stream"
        };
    }
}
