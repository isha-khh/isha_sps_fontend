using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs;
using SPS.Application.DTOs.File;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using System.Collections.Concurrent;
using System.Text.Json;

namespace SPS.Application.Services;

/// <summary>
/// 文件管理服務實現
/// </summary>
public class FileManagementService : IFileManagementService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageProvider _storageProvider;
    private readonly ILogger<FileManagementService> _logger;

    // 批量操作任務狀態追蹤
    private static readonly ConcurrentDictionary<string, BatchOperationResponse> _batchOperations = new();

    public FileManagementService(
        IUnitOfWork unitOfWork,
        IFileStorageProvider storageProvider,
        ILogger<FileManagementService> logger)
    {
        _unitOfWork = unitOfWork;
        _storageProvider = storageProvider;
        _logger = logger;
    }

    public async Task<Result<FileUploadResponse>> UploadFileAsync(
        FileUploadRequest request,
        Guid uploaderId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return Result<FileUploadResponse>.Failure("文件不能為空");
            }

            // 獲取文件信息
            var originalFileName = request.File.FileName;
            var fileExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
            var contentType = request.File.ContentType;
            var fileSize = request.File.Length;

            // 保存文件到存儲
            await using var stream = request.File.OpenReadStream();
            var (storagePath, fileHash) = await _storageProvider.SaveFileAsync(
                stream,
                originalFileName,
                cancellationToken);

            // 創建文件實體
            var uploadedFile = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileNumber = GenerateFileNumber(),
                OriginalFileName = originalFileName,
                StoredFileName = Path.GetFileName(storagePath),
                StoragePath = storagePath,
                FileExtension = fileExtension,
                ContentType = contentType,
                FileSize = fileSize,
                FileHash = fileHash,
                UploadedBy = uploaderId,
                Status = FileStatus.Active,
                Description = request.Description,
                Tags = request.Tags != null ? JsonSerializer.Serialize(request.Tags.Split(',').Select(t => t.Trim()).ToList()) : null,
                IsPublic = request.IsPublic,
                ExpiresAt = request.ExpiresAt,
                CreatedTime = DateTime.UtcNow
            };

            // 保存到數據庫
            await _unitOfWork.Files.AddAsync(uploadedFile, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("File uploaded successfully: {FileNumber} by user {UploaderId}",
                uploadedFile.FileNumber, uploaderId);

            // 返回響應
            var response = new FileUploadResponse
            {
                FileId = uploadedFile.Id,
                FileNumber = uploadedFile.FileNumber,
                FileName = uploadedFile.OriginalFileName,
                FileSize = uploadedFile.FileSize,
                ContentType = uploadedFile.ContentType,
                FileUrl = $"/api/FileManagement/{uploadedFile.Id}/download",
                FileHash = uploadedFile.FileHash,
                UploadedAt = uploadedFile.CreatedTime
            };

            return Result<FileUploadResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return Result<FileUploadResponse>.Failure($"文件上傳失敗: {ex.Message}");
        }
    }

    public async Task<Result<BatchFileUploadResponse>> UploadFilesAsync(
        BatchFileUploadRequest request,
        Guid uploaderId,
        CancellationToken cancellationToken = default)
    {
        var response = new BatchFileUploadResponse
        {
            TotalFiles = request.Files.Count
        };

        foreach (var file in request.Files)
        {
            var uploadRequest = new FileUploadRequest
            {
                File = file,
                IsPublic = request.IsPublic,
                ExpiresAt = request.ExpiresAt
            };

            var result = await UploadFileAsync(uploadRequest, uploaderId, cancellationToken);

            if (result.IsSuccess && result.Data != null)
            {
                response.UploadedFiles.Add(result.Data);
                response.SuccessCount++;
            }
            else
            {
                response.FailedFiles.Add(new FailedFileUpload
                {
                    FileName = file.FileName,
                    ErrorMessage = result.Error ?? "未知錯誤"
                });
                response.FailureCount++;
            }
        }

        return Result<BatchFileUploadResponse>.Success(response);
    }

    public async Task<Result<FileInfoResponse>> GetFileByIdAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<FileInfoResponse>.Failure("文件不存在");
            }

            var response = MapToFileInfoResponse(file);
            return Result<FileInfoResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file by ID: {FileId}", fileId);
            return Result<FileInfoResponse>.Failure($"獲取文件信息失敗: {ex.Message}");
        }
    }

    public async Task<Result<FileInfoResponse>> GetFileByNumberAsync(
        string fileNumber,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByNumberAsync(fileNumber, cancellationToken);

            if (file == null)
            {
                return Result<FileInfoResponse>.Failure("文件不存在");
            }

            var response = MapToFileInfoResponse(file);
            return Result<FileInfoResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file by number: {FileNumber}", fileNumber);
            return Result<FileInfoResponse>.Failure($"獲取文件信息失敗: {ex.Message}");
        }
    }

    public async Task<Result<PagedResponse<FileListItemResponse>>> QueryFilesAsync(
        FileQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (files, totalCount) = await _unitOfWork.Files.QueryFilesAsync(
                request.Keyword,
                request.Status,
                request.UploadedBy,
                request.FileExtension,
                request.FileType,
                request.ParentId,
                request.IsRoot,
                request.PageIndex,
                request.PageSize,
                cancellationToken);

            var items = files.Select(MapToFileListItemResponse).ToList();

            var response = new PagedResponse<FileListItemResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = request.PageIndex,
                PageSize = request.PageSize
            };

            return Result<PagedResponse<FileListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying files");
            return Result<PagedResponse<FileListItemResponse>>.Failure($"查詢文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<FileInfoResponse>> CreateFolderAsync(
        string folderName,
        Guid? parentId,
        Guid creatorId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Create folder entity
            var folder = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileNumber = GenerateFileNumber(),
                OriginalFileName = folderName,
                StoredFileName = "",
                StoragePath = "",
                FileExtension = "folder",
                ContentType = "application/x-directory",
                FileSize = 0,
                FileHash = "",
                UploadedBy = creatorId,
                Status = FileStatus.Active,
                IsFolder = true,
                ParentId = parentId,
                CreatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Files.AddAsync(folder, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<FileInfoResponse>.Success(MapToFileInfoResponse(folder));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating folder");
            return Result<FileInfoResponse>.Failure($"創建資料夾失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RenameFileAsync(
        Guid id,
        string newName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(id, cancellationToken);
            if (file == null) return Result<bool>.Failure("文件不存在");

            file.OriginalFileName = newName;
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error renaming file");
            return Result<bool>.Failure($"重命名失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> MoveFileAsync(
        Guid id,
        Guid? targetParentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(id, cancellationToken);
            if (file == null) return Result<bool>.Failure("文件不存在");

            if (file.Id == targetParentId) return Result<bool>.Failure("無法移動到自身");

            // TODO: check circular dependency if moving folder

            file.ParentId = targetParentId;
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error moving file");
            return Result<bool>.Failure($"移動失敗: {ex.Message}");
        }
    }

    public async Task<Result<FileInfoResponse>> CopyFileAsync(
        Guid id,
        Guid? targetParentId,
        Guid copierId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var originalFile = await _unitOfWork.Files.GetByIdAsync(id, cancellationToken);
            if (originalFile == null) return Result<FileInfoResponse>.Failure("源文件不存在");

            if (originalFile.IsFolder)
            {
                 // Simple folder copy (just create new folder)
                 // Recursive copy is skipped for now
                return await CreateFolderAsync(originalFile.OriginalFileName + " (Copy)", targetParentId, copierId, cancellationToken);
            }

            // Copy physical file
            using var stream = await _storageProvider.ReadFileAsync(originalFile.StoragePath, cancellationToken);
            var (newStoragePath, newFileHash) = await _storageProvider.SaveFileAsync(
                stream,
                originalFile.OriginalFileName, // Keep original name or append copy? Usually keep name if different folder, or append if same.
                cancellationToken);

            // Create new entity
            var newFile = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileNumber = GenerateFileNumber(),
                OriginalFileName = originalFile.OriginalFileName, // Naming conflict strategy? For now exact copy.
                StoredFileName = Path.GetFileName(newStoragePath),
                StoragePath = newStoragePath,
                FileExtension = originalFile.FileExtension,
                ContentType = originalFile.ContentType,
                FileSize = originalFile.FileSize,
                FileHash = newFileHash,
                UploadedBy = copierId,
                Status = FileStatus.Active,
                Description = originalFile.Description,
                Tags = originalFile.Tags,
                IsPublic = originalFile.IsPublic,
                IsFolder = false,
                ParentId = targetParentId,
                CreatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Files.AddAsync(newFile, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<FileInfoResponse>.Success(MapToFileInfoResponse(newFile));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error copying file");
            return Result<FileInfoResponse>.Failure($"複製失敗: {ex.Message}");
        }
    }

    public async Task<Result<FileInfoResponse>> CreateFileAsync(
        string fileName,
        string extension,
        Guid? parentId,
        Guid creatorId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Create empty content
            using var stream = new MemoryStream(Array.Empty<byte>());
            var fullFileName = fileName.EndsWith(extension) ? fileName : $"{fileName}{extension}";

            var (storagePath, fileHash) = await _storageProvider.SaveFileAsync(
                stream,
                fullFileName,
                cancellationToken);

            var newFile = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileNumber = GenerateFileNumber(),
                OriginalFileName = fullFileName,
                StoredFileName = Path.GetFileName(storagePath),
                StoragePath = storagePath,
                FileExtension = extension,
                ContentType = "application/octet-stream", // or map from extension
                FileSize = 0,
                FileHash = fileHash,
                UploadedBy = creatorId,
                Status = FileStatus.Active,
                IsFolder = false,
                ParentId = parentId,
                CreatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Files.AddAsync(newFile, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<FileInfoResponse>.Success(MapToFileInfoResponse(newFile));
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "Error creating file");
             return Result<FileInfoResponse>.Failure($"創建檔案失敗: {ex.Message}");
        }
    }

    public async Task<Result<(Stream FileStream, string FileName, string ContentType)>> DownloadFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<(Stream, string, string)>.Failure("文件不存在");
            }

            if (file.Status != FileStatus.Active)
            {
                return Result<(Stream, string, string)>.Failure("文件不可用");
            }

            // 檢查文件是否過期
            if (file.ExpiresAt.HasValue && file.ExpiresAt.Value < DateTime.UtcNow)
            {
                return Result<(Stream, string, string)>.Failure("文件已過期");
            }

            // 讀取文件流（根據是否為靜態檔案決定讀取位置）
            Stream stream;
            if (file.IsStaticFile && !string.IsNullOrEmpty(file.StaticFilePath))
            {
                // 靜態檔案從 wwwroot 讀取
                stream = await _storageProvider.ReadStaticFileAsync(file.StaticFilePath, cancellationToken);
            }
            else
            {
                // 一般上傳檔案從上傳目錄讀取
                stream = await _storageProvider.ReadFileAsync(file.StoragePath, cancellationToken);
            }

            // 更新下載統計
            file.DownloadCount++;
            file.LastAccessedAt = DateTime.UtcNow;
            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("File downloaded: {FileNumber}", file.FileNumber);

            return Result<(Stream, string, string)>.Success((stream, file.OriginalFileName, file.ContentType));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file: {FileId}", fileId);
            return Result<(Stream, string, string)>.Failure($"文件下載失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteFileAsync(
        Guid fileId,
        Guid deletedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            // 軟刪除
            file.Status = FileStatus.Deleted;
            file.DeletedAt = DateTime.UtcNow;
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("File soft deleted: {FileNumber} by user {DeletedBy}",
                file.FileNumber, deletedBy);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileId}", fileId);
            return Result<bool>.Failure($"刪除文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> PermanentDeleteFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            // 從存儲中刪除物理文件
            if (!file.IsFolder && !string.IsNullOrEmpty(file.StoragePath))
            {
                await _storageProvider.DeleteFileAsync(file.StoragePath, cancellationToken);
            }

            // 從數據庫中刪除記錄
            await _unitOfWork.Files.DeleteAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("File permanently deleted: {FileNumber}", file.FileNumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error permanently deleting file: {FileId}", fileId);
            return Result<bool>.Failure($"永久刪除文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> UpdateFileDescriptionAsync(
        Guid fileId,
        string description,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            file.Description = description;
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating file description: {FileId}", fileId);
            return Result<bool>.Failure($"更新文件描述失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> UpdateFileTagsAsync(
        Guid fileId,
        List<string> tags,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            file.Tags = JsonSerializer.Serialize(tags);
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating file tags: {FileId}", fileId);
            return Result<bool>.Failure($"更新文件標簽失敗: {ex.Message}");
        }
    }

    public async Task<Result<FileStatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var statistics = await _unitOfWork.Files.GetStatisticsAsync(cancellationToken);
            return Result<FileStatisticsResponse>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file statistics");
            return Result<FileStatisticsResponse>.Failure($"獲取文件統計失敗: {ex.Message}");
        }
    }

    // Helper Methods

    private static string GenerateFileNumber()
    {
        return $"F{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static FileInfoResponse MapToFileInfoResponse(UploadedFile file)
    {
        var tags = new List<string>();
        if (!string.IsNullOrWhiteSpace(file.Tags))
        {
            try
            {
                tags = JsonSerializer.Deserialize<List<string>>(file.Tags) ?? new List<string>();
            }
            catch
            {
                // Ignore deserialization errors
            }
        }

        return new FileInfoResponse
        {
            Id = file.Id,
            FileNumber = file.FileNumber,
            OriginalFileName = file.OriginalFileName,
            FileExtension = file.FileExtension,
            ContentType = file.ContentType,
            FileSize = file.FileSize,
            FormattedFileSize = FormatFileSize(file.FileSize),
            FileHash = file.FileHash,
            Status = file.Status,
            Description = file.Description,
            Tags = tags,
            DownloadCount = file.DownloadCount,
            IsPublic = file.IsPublic,
            IsFolder = file.IsFolder,
            UploadedBy = file.UploadedBy,
            UploaderName = file.Uploader != null
                ? (file.Uploader.Nickname ?? file.Uploader.Email)
                : null,
            FileUrl = $"/api/FileManagement/{file.Id}/download",
            CreatedTime = file.CreatedTime,
            LastAccessedAt = file.LastAccessedAt,
            ExpiresAt = file.ExpiresAt
        };
    }

    private static FileListItemResponse MapToFileListItemResponse(UploadedFile file)
    {
        return new FileListItemResponse
        {
            Id = file.Id,
            FileNumber = file.FileNumber,
            OriginalFileName = file.OriginalFileName,
            FileExtension = file.FileExtension,
            FileSize = file.FileSize,
            FormattedFileSize = FormatFileSize(file.FileSize),
            ContentType = file.ContentType,
            Status = file.Status,
            IsFolder = file.IsFolder,
            UploaderName = file.Uploader != null
                ? (file.Uploader.Nickname ?? file.Uploader.Email)
                : null,
            CreatedTime = file.CreatedTime
        };
    }

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;

        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }

    public async Task<Result<BatchOperationResponse>> BatchDeleteAsync(
        BatchDeleteRequest request,
        Guid deletedBy,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        var taskId = Guid.NewGuid().ToString("N");
        var response = new BatchOperationResponse
        {
            TaskId = taskId,
            Status = BatchOperationStatus.InProgress,
            TotalCount = request.FileIds.Count,
            StartedAt = DateTime.UtcNow
        };

        _batchOperations[taskId] = response;

        try
        {
            foreach (var fileId in request.FileIds)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    response.Status = BatchOperationStatus.Cancelled;
                    break;
                }

                try
                {
                    var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
                    if (file == null)
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = "Unknown",
                            ErrorMessage = "文件不存在"
                        });
                        response.FailureCount++;
                    }
                    else
                    {
                        if (request.Permanent)
                        {
                            // 硬刪除：刪除物理文件和數據庫記錄
                            if (!file.IsFolder && !string.IsNullOrEmpty(file.StoragePath))
                            {
                                await _storageProvider.DeleteFileAsync(file.StoragePath, cancellationToken);
                            }
                            await _unitOfWork.Files.DeleteAsync(file, cancellationToken);
                        }
                        else
                        {
                            // 軟刪除：更新狀態
                            file.Status = FileStatus.Deleted;
                            file.DeletedAt = DateTime.UtcNow;
                            file.UpdatedTime = DateTime.UtcNow;
                            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                        }
                        response.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    response.FailedItems.Add(new BatchOperationFailedItem
                    {
                        FileId = fileId,
                        FileName = "Unknown",
                        ErrorMessage = ex.Message
                    });
                    response.FailureCount++;
                    _logger.LogError(ex, "Error deleting file {FileId} in batch operation", fileId);
                }

                response.ProcessedCount++;
                progressCallback?.Invoke(response);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 設置最終狀態
            response.CompletedAt = DateTime.UtcNow;
            if (response.FailureCount == 0)
            {
                response.Status = BatchOperationStatus.Completed;
            }
            else if (response.SuccessCount == 0)
            {
                response.Status = BatchOperationStatus.Failed;
            }
            else
            {
                response.Status = BatchOperationStatus.PartiallyCompleted;
            }

            _logger.LogInformation("Batch delete completed: TaskId={TaskId}, Success={Success}, Failed={Failed}",
                taskId, response.SuccessCount, response.FailureCount);

            return Result<BatchOperationResponse>.Success(response);
        }
        catch (Exception ex)
        {
            response.Status = BatchOperationStatus.Failed;
            response.CompletedAt = DateTime.UtcNow;
            _logger.LogError(ex, "Error in batch delete operation");
            return Result<BatchOperationResponse>.Failure($"批量刪除失敗: {ex.Message}");
        }
    }

    public async Task<Result<BatchOperationResponse>> BatchMoveAsync(
        BatchMoveRequest request,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        var taskId = Guid.NewGuid().ToString("N");
        var response = new BatchOperationResponse
        {
            TaskId = taskId,
            Status = BatchOperationStatus.InProgress,
            TotalCount = request.FileIds.Count,
            StartedAt = DateTime.UtcNow
        };

        _batchOperations[taskId] = response;

        try
        {
            // 驗證目標資料夾
            if (request.TargetParentId.HasValue)
            {
                var targetFolder = await _unitOfWork.Files.GetByIdAsync(request.TargetParentId.Value, cancellationToken);
                if (targetFolder == null || !targetFolder.IsFolder)
                {
                    response.Status = BatchOperationStatus.Failed;
                    response.CompletedAt = DateTime.UtcNow;
                    return Result<BatchOperationResponse>.Failure("目標資料夾不存在或不是資料夾");
                }
            }

            foreach (var fileId in request.FileIds)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    response.Status = BatchOperationStatus.Cancelled;
                    break;
                }

                try
                {
                    var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
                    if (file == null)
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = "Unknown",
                            ErrorMessage = "文件不存在"
                        });
                        response.FailureCount++;
                    }
                    else if (file.Id == request.TargetParentId)
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = file.OriginalFileName,
                            ErrorMessage = "無法移動到自身"
                        });
                        response.FailureCount++;
                    }
                    else
                    {
                        file.ParentId = request.TargetParentId;
                        file.UpdatedTime = DateTime.UtcNow;
                        await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                        response.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    response.FailedItems.Add(new BatchOperationFailedItem
                    {
                        FileId = fileId,
                        FileName = "Unknown",
                        ErrorMessage = ex.Message
                    });
                    response.FailureCount++;
                    _logger.LogError(ex, "Error moving file {FileId} in batch operation", fileId);
                }

                response.ProcessedCount++;
                progressCallback?.Invoke(response);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            response.CompletedAt = DateTime.UtcNow;
            if (response.FailureCount == 0)
            {
                response.Status = BatchOperationStatus.Completed;
            }
            else if (response.SuccessCount == 0)
            {
                response.Status = BatchOperationStatus.Failed;
            }
            else
            {
                response.Status = BatchOperationStatus.PartiallyCompleted;
            }

            _logger.LogInformation("Batch move completed: TaskId={TaskId}, Success={Success}, Failed={Failed}",
                taskId, response.SuccessCount, response.FailureCount);

            return Result<BatchOperationResponse>.Success(response);
        }
        catch (Exception ex)
        {
            response.Status = BatchOperationStatus.Failed;
            response.CompletedAt = DateTime.UtcNow;
            _logger.LogError(ex, "Error in batch move operation");
            return Result<BatchOperationResponse>.Failure($"批量移動失敗: {ex.Message}");
        }
    }

    public async Task<Result<BatchOperationResponse>> BatchCopyAsync(
        BatchCopyRequest request,
        Guid copierId,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        var taskId = Guid.NewGuid().ToString("N");
        var response = new BatchOperationResponse
        {
            TaskId = taskId,
            Status = BatchOperationStatus.InProgress,
            TotalCount = request.FileIds.Count,
            StartedAt = DateTime.UtcNow,
            CreatedFiles = new List<FileInfoResponse>()
        };

        _batchOperations[taskId] = response;

        try
        {
            // 驗證目標資料夾
            if (request.TargetParentId.HasValue)
            {
                var targetFolder = await _unitOfWork.Files.GetByIdAsync(request.TargetParentId.Value, cancellationToken);
                if (targetFolder == null || !targetFolder.IsFolder)
                {
                    response.Status = BatchOperationStatus.Failed;
                    response.CompletedAt = DateTime.UtcNow;
                    return Result<BatchOperationResponse>.Failure("目標資料夾不存在或不是資料夾");
                }
            }

            foreach (var fileId in request.FileIds)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    response.Status = BatchOperationStatus.Cancelled;
                    break;
                }

                try
                {
                    var result = await CopyFileAsync(fileId, request.TargetParentId, copierId, cancellationToken);
                    if (result.IsSuccess && result.Data != null)
                    {
                        response.SuccessCount++;
                        response.CreatedFiles!.Add(result.Data);
                    }
                    else
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = "Unknown",
                            ErrorMessage = result.Error ?? "複製失敗"
                        });
                        response.FailureCount++;
                    }
                }
                catch (Exception ex)
                {
                    response.FailedItems.Add(new BatchOperationFailedItem
                    {
                        FileId = fileId,
                        FileName = "Unknown",
                        ErrorMessage = ex.Message
                    });
                    response.FailureCount++;
                    _logger.LogError(ex, "Error copying file {FileId} in batch operation", fileId);
                }

                response.ProcessedCount++;
                progressCallback?.Invoke(response);
            }

            response.CompletedAt = DateTime.UtcNow;
            if (response.FailureCount == 0)
            {
                response.Status = BatchOperationStatus.Completed;
            }
            else if (response.SuccessCount == 0)
            {
                response.Status = BatchOperationStatus.Failed;
            }
            else
            {
                response.Status = BatchOperationStatus.PartiallyCompleted;
            }

            _logger.LogInformation("Batch copy completed: TaskId={TaskId}, Success={Success}, Failed={Failed}",
                taskId, response.SuccessCount, response.FailureCount);

            return Result<BatchOperationResponse>.Success(response);
        }
        catch (Exception ex)
        {
            response.Status = BatchOperationStatus.Failed;
            response.CompletedAt = DateTime.UtcNow;
            _logger.LogError(ex, "Error in batch copy operation");
            return Result<BatchOperationResponse>.Failure($"批量複製失敗: {ex.Message}");
        }
    }

    public BatchOperationResponse? GetBatchOperationStatus(string taskId)
    {
        _batchOperations.TryGetValue(taskId, out var response);
        return response;
    }

    public async Task<Result<bool>> RestoreFileAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);

            if (file == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            if (file.Status != FileStatus.Deleted)
            {
                return Result<bool>.Failure("文件不在回收桶中");
            }

            // 還原文件
            file.Status = FileStatus.Active;
            file.DeletedAt = null;
            file.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("File restored: {FileNumber}", file.FileNumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring file: {FileId}", fileId);
            return Result<bool>.Failure($"還原文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<BatchOperationResponse>> BatchRestoreAsync(
        List<Guid> fileIds,
        Action<BatchOperationResponse>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        var taskId = Guid.NewGuid().ToString("N");
        var response = new BatchOperationResponse
        {
            TaskId = taskId,
            Status = BatchOperationStatus.InProgress,
            TotalCount = fileIds.Count,
            StartedAt = DateTime.UtcNow
        };

        _batchOperations[taskId] = response;

        try
        {
            foreach (var fileId in fileIds)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    response.Status = BatchOperationStatus.Cancelled;
                    break;
                }

                try
                {
                    var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
                    if (file == null)
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = "Unknown",
                            ErrorMessage = "文件不存在"
                        });
                        response.FailureCount++;
                    }
                    else if (file.Status != FileStatus.Deleted)
                    {
                        response.FailedItems.Add(new BatchOperationFailedItem
                        {
                            FileId = fileId,
                            FileName = file.OriginalFileName,
                            ErrorMessage = "文件不在回收桶中"
                        });
                        response.FailureCount++;
                    }
                    else
                    {
                        file.Status = FileStatus.Active;
                        file.DeletedAt = null;
                        file.UpdatedTime = DateTime.UtcNow;
                        await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                        response.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    response.FailedItems.Add(new BatchOperationFailedItem
                    {
                        FileId = fileId,
                        FileName = "Unknown",
                        ErrorMessage = ex.Message
                    });
                    response.FailureCount++;
                    _logger.LogError(ex, "Error restoring file {FileId} in batch operation", fileId);
                }

                response.ProcessedCount++;
                progressCallback?.Invoke(response);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            response.CompletedAt = DateTime.UtcNow;
            if (response.FailureCount == 0)
            {
                response.Status = BatchOperationStatus.Completed;
            }
            else if (response.SuccessCount == 0)
            {
                response.Status = BatchOperationStatus.Failed;
            }
            else
            {
                response.Status = BatchOperationStatus.PartiallyCompleted;
            }

            _logger.LogInformation("Batch restore completed: TaskId={TaskId}, Success={Success}, Failed={Failed}",
                taskId, response.SuccessCount, response.FailureCount);

            return Result<BatchOperationResponse>.Success(response);
        }
        catch (Exception ex)
        {
            response.Status = BatchOperationStatus.Failed;
            response.CompletedAt = DateTime.UtcNow;
            _logger.LogError(ex, "Error in batch restore operation");
            return Result<BatchOperationResponse>.Failure($"批量還原失敗: {ex.Message}");
        }
    }

    public async Task<Result<ScanStaticFilesResponse>> ScanStaticFilesAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = new ScanStaticFilesResponse
            {
                ScannedAt = DateTime.UtcNow
            };

            // 掃描 wwwroot 下的所有檔案
            var staticFiles = await _storageProvider.ScanWebRootFilesAsync(cancellationToken);
            response.ScannedCount = staticFiles.Count;

            // 一次性取得所有已存在的靜態檔案路徑（避免 N+1 查詢問題）
            var existingPaths = await _unitOfWork.Files.GetAllStaticFilePathsAsync(cancellationToken);

            foreach (var fileInfo in staticFiles)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    // 使用 HashSet 檢查該靜態檔案是否已存在
                    if (existingPaths.Contains(fileInfo.RelativePath))
                    {
                        response.ExistingCount++;
                        continue;
                    }

                    // 建立新的檔案記錄
                    var uploadedFile = new UploadedFile
                    {
                        Id = Guid.NewGuid(),
                        FileNumber = GenerateFileNumber(),
                        OriginalFileName = fileInfo.FileName,
                        StoredFileName = fileInfo.FileName,
                        StoragePath = fileInfo.RelativePath,
                        FileExtension = fileInfo.Extension,
                        ContentType = fileInfo.ContentType,
                        FileSize = fileInfo.FileSize,
                        FileHash = fileInfo.FileHash,
                        UploadedBy = null, // 系統檔案，無上傳者
                        Status = FileStatus.Active,
                        IsPublic = true, // 靜態檔案預設公開
                        IsFolder = false,
                        IsStaticFile = true,
                        StaticFilePath = fileInfo.RelativePath,
                        CreatedTime = DateTime.UtcNow
                    };

                    await _unitOfWork.Files.AddAsync(uploadedFile, cancellationToken);
                    response.AddedCount++;
                }
                catch (Exception ex)
                {
                    response.FailedItems.Add(new ScanFailedItem
                    {
                        FilePath = fileInfo.RelativePath,
                        ErrorMessage = ex.Message
                    });
                    _logger.LogWarning(ex, "Error adding static file to database: {FilePath}", fileInfo.RelativePath);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Static files scan completed: Scanned={Scanned}, Added={Added}, Existing={Existing}, Failed={Failed}",
                response.ScannedCount, response.AddedCount, response.ExistingCount, response.FailedItems.Count);

            return Result<ScanStaticFilesResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning static files");
            return Result<ScanStaticFilesResponse>.Failure($"掃描靜態檔案失敗: {ex.Message}");
        }
    }

    public async Task<Result<PagedResponse<StaticFileListItemResponse>>> QueryStaticFilesAsync(
        StaticFileQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (files, totalCount) = await _unitOfWork.Files.QueryStaticFilesAsync(
                request.Keyword,
                request.IncludeDeleted,
                request.OnlyDeleted,
                request.FileExtension,
                request.PageIndex,
                request.PageSize,
                cancellationToken);

            var webRootPath = _storageProvider.GetWebRootPath();
            var items = files.Select(file => new StaticFileListItemResponse
            {
                Id = file.Id,
                FileNumber = file.FileNumber,
                OriginalFileName = file.OriginalFileName,
                StaticFilePath = file.StaticFilePath ?? string.Empty,
                FileExtension = file.FileExtension,
                FileSize = file.FileSize,
                FormattedFileSize = FormatFileSize(file.FileSize),
                ContentType = file.ContentType,
                Status = file.Status.ToString(),
                IsDeleted = file.Status == FileStatus.Deleted,
                DeletedAt = file.DeletedAt,
                CreatedTime = file.CreatedTime,
                PublicUrl = $"/{file.StaticFilePath}"
            }).ToList();

            var response = new PagedResponse<StaticFileListItemResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = request.PageIndex,
                PageSize = request.PageSize
            };

            return Result<PagedResponse<StaticFileListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying static files");
            return Result<PagedResponse<StaticFileListItemResponse>>.Failure($"查詢靜態檔案失敗: {ex.Message}");
        }
    }
}
