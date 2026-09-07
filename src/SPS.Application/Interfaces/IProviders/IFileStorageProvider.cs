namespace SPS.Application.Interfaces;

/// <summary>
/// 文件存儲提供者接口
/// </summary>
public interface IFileStorageProvider
{
    /// <summary>
    /// 保存文件到存儲
    /// </summary>
    /// <param name="stream">文件流</param>
    /// <param name="fileName">文件名</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>存儲路徑和文件哈希值</returns>
    Task<(string StoragePath, string FileHash)> SaveFileAsync(
        Stream stream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 讀取文件流
    /// </summary>
    /// <param name="storagePath">存儲路徑</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件流</returns>
    Task<Stream> ReadFileAsync(
        string storagePath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除文件
    /// </summary>
    /// <param name="storagePath">存儲路徑</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task DeleteFileAsync(
        string storagePath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查文件是否存在
    /// </summary>
    /// <param name="storagePath">存儲路徑</param>
    /// <returns>是否存在</returns>
    bool FileExists(string storagePath);

    /// <summary>
    /// 計算文件哈希值
    /// </summary>
    /// <param name="stream">文件流</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>哈希值</returns>
    Task<string> ComputeFileHashAsync(
        Stream stream,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 掃描 wwwroot 靜態檔案
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>檔案資訊列表 (相對路徑, 檔案名稱, 副檔名, 大小, MIME類型, Hash)</returns>
    Task<List<StaticFileInfo>> ScanWebRootFilesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取 wwwroot 路徑
    /// </summary>
    /// <returns>wwwroot 完整路徑</returns>
    string GetWebRootPath();

    /// <summary>
    /// 讀取靜態檔案流（從 wwwroot）
    /// </summary>
    /// <param name="relativePath">相對於 wwwroot 的路徑</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件流</returns>
    Task<Stream> ReadStaticFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// 靜態檔案資訊
/// </summary>
public class StaticFileInfo
{
    /// <summary>
    /// 相對路徑（相對於 wwwroot）
    /// </summary>
    public string RelativePath { get; set; } = string.Empty;

    /// <summary>
    /// 檔案名稱
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 副檔名
    /// </summary>
    public string Extension { get; set; } = string.Empty;

    /// <summary>
    /// 檔案大小（位元組）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// MIME 類型
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 檔案 Hash
    /// </summary>
    public string FileHash { get; set; } = string.Empty;
}
