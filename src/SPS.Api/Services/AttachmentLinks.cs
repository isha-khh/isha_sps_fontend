using SPS.Application.DTOs.News;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Api.Services;

/// <summary>
/// 附件（檔案管理中的檔案 Id）的檢查與下載資訊：後台存附件時檢查每個檔案都能用，前台顯示下載連結時解析成檔名、大小與網址。
/// 可用的檔案 = 檔案管理中存在、不是資料夾、沒被刪除、不是會員申請附件（含申請人個資，不能當公開下載檔）。
/// </summary>
public class AttachmentLinks
{
    public const int MaxAttachments = 10;

    private readonly IFileManagementService _files;

    public AttachmentLinks(IFileManagementService files) => _files = files;

    /// <summary>檢查後台送來的附件清單；沒問題回傳 null，有問題回傳要顯示的訊息</summary>
    public async Task<string?> ValidateAsync(IReadOnlyCollection<Guid>? fileIds, CancellationToken ct)
    {
        if (fileIds == null) return null;
        if (fileIds.Count > MaxAttachments) return $"附件最多 {MaxAttachments} 個";
        foreach (var id in fileIds)
        {
            if (await GetUsableAsync(id, ct) == null) return "附件必須是檔案管理中存在的檔案（不能是資料夾、已刪除的檔案或會員申請附件）";
        }

        return null;
    }

    /// <summary>把附件 Id 解析成下載資訊；不能用的檔案（已被刪除等）直接略過</summary>
    public async Task<List<NewsAttachmentDto>> ResolveAsync(IEnumerable<Guid> fileIds, CancellationToken ct)
    {
        var result = new List<NewsAttachmentDto>();
        foreach (var id in fileIds)
        {
            var file = await GetUsableAsync(id, ct);
            if (file == null) continue;
            result.Add(new NewsAttachmentDto
            {
                FileId = file.Id,
                FileName = file.OriginalFileName,
                FormattedFileSize = file.FormattedFileSize,
                Url = $"/api/FileManagement/{file.Id}/download",
            });
        }

        return result;
    }

    private async Task<SPS.Application.DTOs.File.FileInfoResponse?> GetUsableAsync(Guid fileId, CancellationToken ct)
    {
        var info = await _files.GetFileByIdAsync(fileId, ct);
        if (!info.IsSuccess || info.Data == null) return null;
        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return null;
        if (await _files.IsApplicationDocumentFileAsync(file.Id, ct)) return null;
        return file;
    }
}
