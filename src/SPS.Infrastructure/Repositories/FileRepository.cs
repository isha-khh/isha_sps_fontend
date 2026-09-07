using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 文件倉儲實現
/// </summary>
public class FileRepository : IFileRepository
{
    private readonly ApplicationDbContext _context;

    public FileRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(UploadedFile file, CancellationToken cancellationToken = default)
    {
        await _context.UploadedFiles.AddAsync(file, cancellationToken);
    }

    public Task UpdateAsync(UploadedFile file, CancellationToken cancellationToken = default)
    {
        _context.UploadedFiles.Update(file);
        return Task.CompletedTask;
    }

    public async Task<UploadedFile?> GetByIdAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles
            .Include(f => f.Uploader)
            .FirstOrDefaultAsync(f => f.Id == fileId, cancellationToken);
    }

    public async Task<UploadedFile?> GetByNumberAsync(string fileNumber, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles
            .Include(f => f.Uploader)
            .FirstOrDefaultAsync(f => f.FileNumber == fileNumber, cancellationToken);
    }

    public async Task<UploadedFile?> GetByHashAsync(string fileHash, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles
            .FirstOrDefaultAsync(f => f.FileHash == fileHash && f.Status == FileStatus.Active, cancellationToken);
    }

    public async Task<(List<UploadedFile> Items, int TotalCount)> QueryFilesAsync(
        string? keyword,
        FileStatus? status,
        Guid? uploadedBy,
        string? fileExtension,
        string? fileType,
        Guid? parentId,
        bool? isRoot,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UploadedFiles
            .Include(f => f.Uploader)
            .AsQueryable();

        // 關鍵字搜索
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(f => f.OriginalFileName.Contains(keyword) || f.FileNumber.Contains(keyword));
        }

        // 狀態過濾 - 如果是查詢回收桶，則查詢已刪除的文件
        var isTrashQuery = !string.IsNullOrWhiteSpace(fileType) && fileType.ToLower() == "trash";

        if (isTrashQuery)
        {
            // 回收桶：只顯示已刪除的文件
            query = query.Where(f => f.Status == FileStatus.Deleted);
        }
        else if (status.HasValue)
        {
            query = query.Where(f => f.Status == status.Value);
        }
        else
        {
            // 默認不顯示已刪除的文件
            query = query.Where(f => f.Status != FileStatus.Deleted);
        }

        // 上傳者過濾
        if (uploadedBy.HasValue)
        {
            query = query.Where(f => f.UploadedBy == uploadedBy.Value);
        }

        // Hierarchy Logic:
        // If searching (keyword) or filtering by specific type (extension/type), we typically ignore hierarchy (Flat View).
        // If simply browsing (no keyword, no specific type filter), we respect ParentId/IsRoot.
        // 回收桶也使用平面視圖，顯示所有已刪除的文件
        bool isFlatView = !string.IsNullOrWhiteSpace(keyword) ||
                          !string.IsNullOrWhiteSpace(fileExtension) ||
                          isTrashQuery ||
                          (!string.IsNullOrWhiteSpace(fileType) && fileType.ToLower() != "folder");

        if (!isFlatView)
        {
            if (parentId.HasValue)
            {
                query = query.Where(f => f.ParentId == parentId.Value);
            }
            else if (isRoot == true)
            {
                query = query.Where(f => f.ParentId == null);
            }
        }

        // 文件類型過濾 (Extension)
        if (!string.IsNullOrWhiteSpace(fileExtension))
        {
            query = query.Where(f => f.FileExtension == fileExtension);
        }

        // 文件種類過濾
        if (!string.IsNullOrWhiteSpace(fileType))
        {
            var type = fileType.ToLower();
            if (type == "folder")
            {
                query = query.Where(f => f.IsFolder);
            }
            else if (type == "image" || type == "images")
            {
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg" };
                query = query.Where(f => imageExtensions.Contains(f.FileExtension.ToLower()));
            }
            else if (type == "video" || type == "videos")
            {
                var videoExtensions = new[] { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv" };
                query = query.Where(f => videoExtensions.Contains(f.FileExtension.ToLower()));
            }
            else if (type == "document" || type == "documents")
            {
                var docExtensions = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv" };
                query = query.Where(f => docExtensions.Contains(f.FileExtension.ToLower()));
            }
             else if (type == "other" || type == "others")
            {
                var knownExtensions = new[]
                {
                    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg",
                    ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv",
                    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"
                };
                query = query.Where(f => !knownExtensions.Contains(f.FileExtension.ToLower()) && !f.IsFolder);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            // Folders first, then files
            .OrderByDescending(f => f.IsFolder)
            .ThenByDescending(f => f.CreatedTime)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<List<UploadedFile>> GetByUploaderIdAsync(Guid uploaderId, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles
            .Where(f => f.UploadedBy == uploaderId && f.Status == FileStatus.Active)
            .OrderByDescending(f => f.CreatedTime)
            .ToListAsync(cancellationToken);
    }

    public Task DeleteAsync(UploadedFile file, CancellationToken cancellationToken = default)
    {
        _context.UploadedFiles.Remove(file);
        return Task.CompletedTask;
    }

    public async Task<SPS.Application.DTOs.File.FileStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var files = await _context.UploadedFiles
            .Where(f => f.Status != FileStatus.Deleted)
            .Select(f => new { f.FileExtension, f.FileSize })
            .ToListAsync(cancellationToken);

        // 回收桶統計（軟刪除的文件）
        var recycleBinFiles = await _context.UploadedFiles
            .Where(f => f.Status == FileStatus.Deleted)
            .Select(f => new { f.FileSize })
            .ToListAsync(cancellationToken);

        var recycleBinCount = recycleBinFiles.Count;
        var recycleBinSize = recycleBinFiles.Sum(f => f.FileSize);

        var totalFiles = files.Count;
        var totalSize = files.Sum(f => f.FileSize);
        var totalSpace = 250L * 1024 * 1024 * 1024; // 250 GB

        var imageExtensions = new HashSet<string> { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg" };
        var videoExtensions = new HashSet<string> { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv" };
        var docExtensions = new HashSet<string> { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv" };

        var imagesCount = files.Count(f => imageExtensions.Contains(f.FileExtension.ToLower()));
        var videosCount = files.Count(f => videoExtensions.Contains(f.FileExtension.ToLower()));
        var docsCount = files.Count(f => docExtensions.Contains(f.FileExtension.ToLower()));
        var othersCount = totalFiles - imagesCount - videosCount - docsCount;

        var storageByExtension = files
            .GroupBy(f => f.FileExtension.ToLower())
            .ToDictionary(g => g.Key, g => g.Sum(f => f.FileSize));

        return new SPS.Application.DTOs.File.FileStatisticsResponse
        {
            TotalFiles = totalFiles,
            TotalSize = totalSize,
            FormattedTotalSize = FormatFileSize(totalSize),
            UsedSpaceBytes = totalSize,
            TotalSpaceBytes = totalSpace,
            UsagePercentage = totalSpace > 0 ? (double)totalSize / totalSpace * 100 : 0,
            RecycleBinCount = recycleBinCount,
            RecycleBinSize = recycleBinSize,
            FormattedRecycleBinSize = FormatFileSize(recycleBinSize),
            FileTypeDistribution = new SPS.Application.DTOs.File.FileTypeDistribution
            {
                Images = imagesCount,
                Videos = videosCount,
                Documents = docsCount,
                Others = othersCount
            },
            StorageByExtension = storageByExtension
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

    public async Task<bool> ExistsAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles.AnyAsync(f => f.Id == fileId, cancellationToken);
    }

    public async Task<UploadedFile?> GetByStaticFilePathAsync(string staticFilePath, CancellationToken cancellationToken = default)
    {
        return await _context.UploadedFiles
            .FirstOrDefaultAsync(f => f.IsStaticFile && f.StaticFilePath == staticFilePath, cancellationToken);
    }

    public async Task<HashSet<string>> GetAllStaticFilePathsAsync(CancellationToken cancellationToken = default)
    {
        var paths = await _context.UploadedFiles
            .Where(f => f.IsStaticFile && f.StaticFilePath != null)
            .Select(f => f.StaticFilePath!)
            .ToListAsync(cancellationToken);

        return new HashSet<string>(paths, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<(List<UploadedFile> Items, int TotalCount)> QueryStaticFilesAsync(
        string? keyword,
        bool includeDeleted,
        bool onlyDeleted,
        string? fileExtension,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UploadedFiles
            .Where(f => f.IsStaticFile)
            .AsQueryable();

        // 關鍵字搜索
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(f => f.OriginalFileName.Contains(keyword) ||
                                     f.StaticFilePath!.Contains(keyword) ||
                                     f.FileNumber.Contains(keyword));
        }

        // 刪除狀態過濾
        if (onlyDeleted)
        {
            query = query.Where(f => f.Status == FileStatus.Deleted);
        }
        else if (!includeDeleted)
        {
            query = query.Where(f => f.Status != FileStatus.Deleted);
        }

        // 副檔名過濾
        if (!string.IsNullOrWhiteSpace(fileExtension))
        {
            var ext = fileExtension.StartsWith(".") ? fileExtension : $".{fileExtension}";
            query = query.Where(f => f.FileExtension.ToLower() == ext.ToLower());
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(f => f.CreatedTime)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
