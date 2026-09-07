using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 文件倉儲接口
/// </summary>
public interface IFileRepository
{
    /// <summary>
    /// 添加文件
    /// </summary>
    /// <param name="file">文件實體</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task AddAsync(UploadedFile file, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新文件
    /// </summary>
    /// <param name="file">文件實體</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task UpdateAsync(UploadedFile file, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據 ID 獲取文件
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件實體</returns>
    Task<UploadedFile?> GetByIdAsync(Guid fileId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據文件編號獲取文件
    /// </summary>
    /// <param name="fileNumber">文件編號</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件實體</returns>
    Task<UploadedFile?> GetByNumberAsync(string fileNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據哈希值獲取文件
    /// </summary>
    /// <param name="fileHash">文件哈希值</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件實體</returns>
    Task<UploadedFile?> GetByHashAsync(string fileHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// 查詢文件列表
    /// </summary>
    /// <param name="keyword">搜索關鍵字</param>
    /// <param name="status">文件狀態</param>
    /// <param name="uploadedBy">上傳者 ID</param>
    /// <param name="fileExtension">文件擴展名</param>
    /// <param name="fileType">文件種類 (image, video, etc)</param>
    /// <param name="parentId">父資料夾 ID</param>
    /// <param name="isRoot">是否僅查詢根目錄</param>
    /// <param name="pageIndex">頁碼</param>
    /// <param name="pageSize">每頁數量</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件列表和總數</returns>
    Task<(List<UploadedFile> Items, int TotalCount)> QueryFilesAsync(
        string? keyword,
        FileStatus? status,
        Guid? uploadedBy,
        string? fileExtension,
        string? fileType,
        Guid? parentId,
        bool? isRoot,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據上傳者獲取文件列表
    /// </summary>
    /// <param name="uploaderId">上傳者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件列表</returns>
    Task<List<UploadedFile>> GetByUploaderIdAsync(Guid uploaderId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除文件
    /// </summary>
    /// <param name="file">文件實體</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task DeleteAsync(UploadedFile file, CancellationToken cancellationToken = default);

    /// <summary>
    /// 檢查文件是否存在
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否存在</returns>
    Task<bool> ExistsAsync(Guid fileId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取文件統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件統計數據</returns>
    Task<SPS.Application.DTOs.File.FileStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據靜態檔案路徑獲取檔案
    /// </summary>
    /// <param name="staticFilePath">靜態檔案相對路徑</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件實體</returns>
    Task<UploadedFile?> GetByStaticFilePathAsync(string staticFilePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有靜態檔案路徑（用於批次檢查）
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>靜態檔案路徑集合</returns>
    Task<HashSet<string>> GetAllStaticFilePathsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 查詢靜態檔案列表
    /// </summary>
    /// <param name="keyword">搜索關鍵字</param>
    /// <param name="includeDeleted">是否包含已刪除的</param>
    /// <param name="onlyDeleted">只顯示已刪除的</param>
    /// <param name="fileExtension">副檔名過濾</param>
    /// <param name="pageIndex">頁碼</param>
    /// <param name="pageSize">每頁數量</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>靜態檔案列表和總數</returns>
    Task<(List<UploadedFile> Items, int TotalCount)> QueryStaticFilesAsync(
        string? keyword,
        bool includeDeleted,
        bool onlyDeleted,
        string? fileExtension,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);
}
