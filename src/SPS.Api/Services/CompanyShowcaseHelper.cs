using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.File;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Api.Services;

/// <summary>
/// 企業「展示圖片」（主要產品暨服務示意圖、獲獎事蹟圖片）的檢查與解析，後台公司管理與會員中心共用。
/// 圖片必須是檔案管理中存在的圖片檔案：不是資料夾、沒被刪除、不是會員申請附件（申請附件含個資，不能公開）。
/// </summary>
public class CompanyShowcaseHelper
{
    public const int MaxImages = 12;

    private readonly IFileManagementService _fileService;

    public CompanyShowcaseHelper(IFileManagementService fileService)
    {
        _fileService = fileService;
    }

    public async Task<FileInfoResponse?> GetUsableImageAsync(Guid fileId, CancellationToken ct)
    {
        var info = await _fileService.GetFileByIdAsync(fileId, ct);
        if (!info.IsSuccess || info.Data == null) return null;
        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return null;
        if (file.ContentType == null || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return null;
        if (await _fileService.IsApplicationDocumentFileAsync(file.Id, ct)) return null;
        return file;
    }

    public async Task<List<CompanyImageDto>> ResolveImagesAsync(IEnumerable<Guid> fileIds, CancellationToken ct)
    {
        var images = new List<CompanyImageDto>();
        foreach (var id in fileIds)
        {
            var file = await GetUsableImageAsync(id, ct);
            if (file == null) continue;
            images.Add(new CompanyImageDto { FileId = file.Id, FileName = file.OriginalFileName, Url = $"/api/FileManagement/{file.Id}/download" });
        }

        return images;
    }

    public async Task ResolveAsync(CompanyResponse company, CancellationToken ct)
    {
        company.ProductImages = await ResolveImagesAsync(company.ProductImageFileIds, ct);
        company.AwardImages = await ResolveImagesAsync(company.AwardImageFileIds, ct);
    }

    /// <summary>檢查送進來的圖片清單（數量上限、每個檔案都要可用）；沒問題回 null，有問題回錯誤訊息</summary>
    public async Task<string?> ValidateAsync(CancellationToken ct, params List<Guid>?[] lists)
    {
        foreach (var ids in lists)
        {
            if (ids == null) continue;
            if (ids.Count > MaxImages) return $"圖片最多 {MaxImages} 張";
            foreach (var id in ids)
            {
                if (await GetUsableImageAsync(id, ct) == null) return "圖片必須是檔案管理中存在的圖片檔案（不能是資料夾、已刪除的檔案或會員申請附件）";
            }
        }

        return null;
    }
}
