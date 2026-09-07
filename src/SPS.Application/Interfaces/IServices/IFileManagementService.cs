using SPS.Application.Common;
using SPS.Application.DTOs;
using SPS.Application.DTOs.File;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 文件管理服務接口
/// </summary>
public interface IFileManagementService
{
    /// <summary>
    /// 上傳文件
    /// </summary>
    /// <param name="request">上傳請求</param>
    /// <param name="uploaderId">上傳者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>上傳結果</returns>
    Task<Result<FileUploadResponse>> UploadFileAsync(
        FileUploadRequest request,
        Guid uploaderId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量上傳文件
    /// </summary>
    /// <param name="request">批量上傳請求</param>
    /// <param name="uploaderId">上傳者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量上傳結果</returns>
    Task<Result<BatchFileUploadResponse>> UploadFilesAsync(
        BatchFileUploadRequest request,
        Guid uploaderId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據 ID 獲取文件信息
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件信息</returns>
    Task<Result<FileInfoResponse>> GetFileByIdAsync(
        Guid fileId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據文件編號獲取文件信息
    /// </summary>
    /// <param name="fileNumber">文件編號</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件信息</returns>
    Task<Result<FileInfoResponse>> GetFileByNumberAsync(
        string fileNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 查詢文件列表
    /// </summary>
    /// <param name="request">查詢請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件列表</returns>
    Task<Result<PagedResponse<FileListItemResponse>>> QueryFilesAsync(
        FileQueryRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建資料夾
    /// </summary>
    /// <param name="folderName">資料夾名稱</param>
    /// <param name="parentId">父資料夾 ID</param>
    /// <param name="creatorId">創建者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建結果</returns>
    Task<Result<FileInfoResponse>> CreateFolderAsync(
        string folderName,
        Guid? parentId,
        Guid creatorId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 重命名文件/資料夾
    /// </summary>
    /// <param name="id">ID</param>
    /// <param name="newName">新名稱</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>結果</returns>
    Task<Result<bool>> RenameFileAsync(
        Guid id,
        string newName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 移動文件/資料夾
    /// </summary>
    /// <param name="id">ID</param>
    /// <param name="targetParentId">目標父資料夾 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>結果</returns>
    Task<Result<bool>> MoveFileAsync(
        Guid id,
        Guid? targetParentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 複製文件
    /// </summary>
    /// <param name="id">源文件 ID</param>
    /// <param name="targetParentId">目標父資料夾 ID</param>
    /// <param name="copierId">操作者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>新文件信息</returns>
    Task<Result<FileInfoResponse>> CopyFileAsync(
        Guid id,
        Guid? targetParentId,
        Guid copierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建空文件 (如文檔、表格)
    /// </summary>
    /// <param name="fileName">文件名</param>
    /// <param name="extension">擴展名</param>
    /// <param name="parentId">父資料夾 ID</param>
    /// <param name="creatorId">創建者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>創建結果</returns>
    Task<Result<FileInfoResponse>> CreateFileAsync(
        string fileName,
        string extension,
        Guid? parentId,
        Guid creatorId,
        CancellationToken cancellationToken = default);


    /// <summary>
    /// 下載文件
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件流和文件信息</returns>
    Task<Result<(Stream FileStream, string FileName, string ContentType)>> DownloadFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除文件（軟刪除）
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="deletedBy">刪除者 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    Task<Result<bool>> DeleteFileAsync(
        Guid fileId,
        Guid deletedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 永久刪除文件（硬刪除）
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    Task<Result<bool>> PermanentDeleteFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新文件描述
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="description">新描述</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新結果</returns>
    Task<Result<bool>> UpdateFileDescriptionAsync(
        Guid fileId,
        string description,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新文件標簽
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="tags">標簽列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新結果</returns>
    Task<Result<bool>> UpdateFileTagsAsync(
        Guid fileId,
        List<string> tags,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取文件統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件統計數據</returns>
    Task<Result<FileStatisticsResponse>> GetStatisticsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量刪除文件
    /// </summary>
    /// <param name="request">批量刪除請求</param>
    /// <param name="deletedBy">操作者 ID</param>
    /// <param name="progressCallback">進度回調</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    Task<Result<BatchOperationResponse>> BatchDeleteAsync(
        BatchDeleteRequest request,
        Guid deletedBy,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量移動文件
    /// </summary>
    /// <param name="request">批量移動請求</param>
    /// <param name="progressCallback">進度回調</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    Task<Result<BatchOperationResponse>> BatchMoveAsync(
        BatchMoveRequest request,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量複製文件
    /// </summary>
    /// <param name="request">批量複製請求</param>
    /// <param name="copierId">操作者 ID</param>
    /// <param name="progressCallback">進度回調</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    Task<Result<BatchOperationResponse>> BatchCopyAsync(
        BatchCopyRequest request,
        Guid copierId,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取批量操作任務狀態
    /// </summary>
    /// <param name="taskId">任務 ID</param>
    /// <returns>任務狀態</returns>
    BatchOperationResponse? GetBatchOperationStatus(string taskId);

    /// <summary>
    /// 還原文件（從回收桶還原）
    /// </summary>
    /// <param name="fileId">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>還原結果</returns>
    Task<Result<bool>> RestoreFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量還原文件
    /// </summary>
    /// <param name="fileIds">文件 ID 列表</param>
    /// <param name="progressCallback">進度回調</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    Task<Result<BatchOperationResponse>> BatchRestoreAsync(
        List<Guid> fileIds,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 掃描 wwwroot 靜態檔案並加入資料庫
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>掃描結果</returns>
    Task<Result<ScanStaticFilesResponse>> ScanStaticFilesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 查詢靜態檔案列表
    /// </summary>
    /// <param name="request">查詢請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>靜態檔案列表</returns>
    Task<Result<PagedResponse<StaticFileListItemResponse>>> QueryStaticFilesAsync(
        StaticFileQueryRequest request,
        CancellationToken cancellationToken = default);
}
