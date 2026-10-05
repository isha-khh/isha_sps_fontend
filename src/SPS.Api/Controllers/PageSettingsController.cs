using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Api.Attributes;
using SPS.Application.DTOs.File;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 前台各頁面的頁面設定（後台「內容管理 → 頁面設定」）。目前有「我要投稿」頁；之後其他頁面的設定也放這裡。
/// </summary>
[ApiController]
[Route("api/page-settings")]
[Produces("application/json")]
[SwaggerTag("頁面設定")]
public class PageSettingsController : ControllerBase
{
    private const string ContributeKey = "PageContribute";
    public const string DownloadsKey = "DownloadResources";

    private readonly ISystemSettingService _settingService;
    private readonly IFileManagementService _fileService;

    public PageSettingsController(ISystemSettingService settingService, IFileManagementService fileService)
    {
        _settingService = settingService;
        _fileService = fileService;
    }

    /// <summary>
    /// 取得「我要投稿」頁設定（後台編輯用，含目前選的檔案資訊）
    /// </summary>
    [HttpGet("contribute")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.ManageSiteContent)]
    [SwaggerOperation(Summary = "取得投稿頁設定（後台）")]
    public async Task<IActionResult> GetContribute(CancellationToken cancellationToken)
    {
        var settings = await LoadAsync(cancellationToken);
        return Ok(new ContributePageAdminDto
        {
            Settings = settings,
            Odt = await ResolveFormatAsync("odt", settings.OdtFileId, ".odt", cancellationToken),
            Pdf = await ResolveFormatAsync("pdf", settings.PdfFileId, ".pdf", cancellationToken),
            Docx = await ResolveFormatAsync("docx", settings.DocxFileId, ".docx", cancellationToken),
        });
    }

    /// <summary>
    /// 更新「我要投稿」頁設定。投稿格式檔必須是檔案管理系統裡真的存在、副檔名對得上的檔案
    /// （ODF＝.odt、PDF＝.pdf、Word＝.docx），不能是資料夾或會員申請附件
    /// </summary>
    [HttpPut("contribute")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.ManageSiteContent)]
    [SwaggerOperation(Summary = "更新投稿頁設定（後台）")]
    public async Task<IActionResult> UpdateContribute(
        [FromBody] ContributePageSettingsDto settings,
        CancellationToken cancellationToken)
    {
        var contactError = ContributePageValidator.ValidateContact(settings);
        if (contactError != null) return BadRequest(new { error = contactError });

        var odtError = await CheckFormatFileAsync("ODF 格式", settings.OdtFileId, ".odt", cancellationToken);
        if (odtError != null) return BadRequest(new { error = odtError });

        var pdfError = await CheckFormatFileAsync("PDF 格式", settings.PdfFileId, ".pdf", cancellationToken);
        if (pdfError != null) return BadRequest(new { error = pdfError });

        var docxError = await CheckFormatFileAsync("Word 格式", settings.DocxFileId, ".docx", cancellationToken);
        if (docxError != null) return BadRequest(new { error = docxError });

        // seed 標記是內部欄位，後台畫面不會送；沿用資料庫裡現有的值，否則每次儲存都會把標記清掉，
        // 下次重啟就會把 seed 檔又套回來、蓋掉管理員剛剛的選擇
        var normalized = ContributePageValidator.Normalize(settings);
        var existing = await LoadAsync(cancellationToken);
        normalized.OdtSeedHash = existing.OdtSeedHash;
        normalized.PdfSeedHash = existing.PdfSeedHash;
        normalized.DocxSeedHash = existing.DocxSeedHash;

        var result = await _settingService.UpdateSettingAsync(ContributeKey, normalized);
        return result.IsSuccess ? Ok(new { message = "Contribute page settings updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 取得「我要投稿」頁的公開資料（前台使用）：可下載的格式與聯絡資訊。
    /// 設定的檔案已被刪除或不可用時，那個格式就不出現，不會回出下載了會 404 的連結
    /// </summary>
    [HttpGet("contribute/public")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "取得投稿頁公開資料")]
    public async Task<IActionResult> GetContributePublic(CancellationToken cancellationToken)
    {
        var settings = await LoadAsync(cancellationToken);

        // 顯示順序：Word（最多人用）、ODF、PDF
        var formats = new List<ContributeFormatFileDto>();
        var docx = await ResolveFormatAsync("docx", settings.DocxFileId, ".docx", cancellationToken);
        var odt = await ResolveFormatAsync("odt", settings.OdtFileId, ".odt", cancellationToken);
        var pdf = await ResolveFormatAsync("pdf", settings.PdfFileId, ".pdf", cancellationToken);
        if (docx != null) formats.Add(docx);
        if (odt != null) formats.Add(odt);
        if (pdf != null) formats.Add(pdf);

        // 聯絡資訊也要過驗證：資料庫裡若有繞過驗證寫進去的髒資料，不輸出
        var contactOk = ContributePageValidator.ValidateContact(settings) == null;
        return Ok(new ContributePagePublicDto
        {
            Formats = formats,
            ContactName = contactOk ? settings.ContactName : string.Empty,
            ContactPhone = contactOk ? settings.ContactPhone : string.Empty,
            ContactEmail = contactOk ? settings.ContactEmail : string.Empty,
        });
    }

    // ==================== 下載資源（固定檔案與外部連結）====================

    /// <summary>
    /// 取得所有下載資源的設定（後台編輯用：目錄、目前設定、目前選的檔案資訊）
    /// </summary>
    [HttpGet("downloads")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.ManageSiteContent)]
    [SwaggerOperation(Summary = "取得下載資源設定（後台）")]
    public async Task<IActionResult> GetDownloads(CancellationToken cancellationToken)
    {
        var stored = await LoadDownloadsAsync(cancellationToken);
        var items = new List<DownloadResourceAdminItemDto>();

        foreach (var slot in DownloadResourceCatalog.Slots)
        {
            stored.Items.TryGetValue(slot.Key, out var entry);
            entry ??= new DownloadResourceEntryDto();

            items.Add(new DownloadResourceAdminItemDto
            {
                Key = slot.Key,
                Group = slot.Group,
                Title = slot.Title,
                UsedAt = slot.UsedAt,
                Formats = slot.Extensions.Select(e => e.TrimStart('.')).ToList(),
                DocxFileId = entry.DocxFileId,
                OdtFileId = entry.OdtFileId,
                PdfFileId = entry.PdfFileId,
                ExternalUrl = entry.ExternalUrl ?? string.Empty,
                Docx = await ResolveDownloadAsync(slot, entry, ".docx", cancellationToken),
                Odt = await ResolveDownloadAsync(slot, entry, ".odt", cancellationToken),
                Pdf = await ResolveDownloadAsync(slot, entry, ".pdf", cancellationToken),
            });
        }

        return Ok(new { items });
    }

    /// <summary>
    /// 更新下載資源。只送要改的項目，沒出現的維持原樣。每個項目：檔案必須是檔案管理中存在、副檔名與該項目
    /// 允許的格式相符（不能是資料夾或會員申請附件）；外部連結只接受 http／https；不存在的 key 一律拒絕
    /// </summary>
    [HttpPut("downloads")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.ManageSiteContent)]
    [SwaggerOperation(Summary = "更新下載資源設定（後台）")]
    public async Task<IActionResult> UpdateDownloads(
        [FromBody] UpdateDownloadResourcesRequest request,
        CancellationToken cancellationToken)
    {
        var stored = await LoadDownloadsAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            var slot = DownloadResourceCatalog.Find(item.Key);
            if (slot == null) return BadRequest(new { error = $"不存在的下載項目：{item.Key}" });

            var urlError = DownloadResourceValidator.ValidateExternalUrl(slot.Title, item.ExternalUrl);
            if (urlError != null) return BadRequest(new { error = urlError });

            var submitted = new (string Extension, Guid? Id)[]
            {
                (".docx", item.DocxFileId), (".odt", item.OdtFileId), (".pdf", item.PdfFileId)
            };

            foreach (var (extension, id) in submitted)
            {
                if (id == null) continue;
                if (!slot.Extensions.Contains(extension))
                    return BadRequest(new { error = $"「{slot.Title}」不提供 {extension} 格式" });

                if (await GetUsableFileAsync(id.Value, extension, cancellationToken) == null)
                    return BadRequest(new
                    {
                        error = $"「{slot.Title}」的 {extension} 必須選擇檔案管理中副檔名為 {extension} 的檔案（檔案不存在、是資料夾或副檔名不符）"
                    });
            }

            // seed 標記是內部欄位，後台不會送；沿用現有的值，否則每次儲存都會清掉標記，
            // 下次重啟就會把 seed 檔又套回來、蓋掉管理員剛剛的選擇
            stored.Items.TryGetValue(item.Key, out var existing);
            stored.Items[item.Key] = new DownloadResourceEntryDto
            {
                DocxFileId = item.DocxFileId,
                OdtFileId = item.OdtFileId,
                PdfFileId = item.PdfFileId,
                ExternalUrl = item.ExternalUrl?.Trim() ?? string.Empty,
                DocxSeedHash = existing?.DocxSeedHash,
                OdtSeedHash = existing?.OdtSeedHash,
                PdfSeedHash = existing?.PdfSeedHash,
            };
        }

        var result = await _settingService.UpdateSettingAsync(DownloadsKey, stored);
        return result.IsSuccess ? Ok(new { message = "Download resources updated" }) : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// 取得所有下載資源的公開資料（前台使用）。有外部連結就只回那個連結；否則回目前真的可下載的檔案格式。
    /// 檔案已被刪除或不可用時那個格式就不出現，不會回出下載了會 404 的連結
    /// </summary>
    [HttpGet("downloads/public")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "取得下載資源公開資料")]
    public async Task<IActionResult> GetDownloadsPublic(CancellationToken cancellationToken)
    {
        var stored = await LoadDownloadsAsync(cancellationToken);
        var items = new Dictionary<string, DownloadResourcePublicDto>();

        foreach (var slot in DownloadResourceCatalog.Slots)
        {
            stored.Items.TryGetValue(slot.Key, out var entry);
            entry ??= new DownloadResourceEntryDto();
            var dto = new DownloadResourcePublicDto { Title = slot.Title };

            // 外部連結輸出前再驗證一次：資料庫裡若有繞過驗證寫進去的髒資料，不輸出
            var externalUrl = entry.ExternalUrl?.Trim() ?? string.Empty;
            if (externalUrl.Length > 0 && DownloadResourceValidator.ValidateExternalUrl(slot.Title, externalUrl) == null)
            {
                dto.Links.Add(new DownloadLinkDto { Kind = "link", Url = externalUrl });
            }
            else
            {
                foreach (var extension in new[] { ".docx", ".odt", ".pdf" })
                {
                    var file = await ResolveDownloadAsync(slot, entry, extension, cancellationToken);
                    if (file == null) continue;
                    dto.Links.Add(new DownloadLinkDto
                    {
                        Kind = file.Kind,
                        Url = file.Url,
                        FileName = file.FileName,
                        FormattedFileSize = file.FormattedFileSize,
                    });
                }
            }

            items[slot.Key] = dto;
        }

        return Ok(new { items });
    }

    private async Task<DownloadResourcesSettingsDto> LoadDownloadsAsync(CancellationToken cancellationToken)
    {
        var result = await _settingService.GetSettingAsync<DownloadResourcesSettingsDto>(DownloadsKey, cancellationToken);
        return result.IsSuccess ? result.Data ?? new DownloadResourcesSettingsDto() : new DownloadResourcesSettingsDto();
    }

    /// <summary>
    /// 把某個項目某個格式的檔案 id 換成可下載的資訊；該項目不提供這個格式、沒設定、或檔案不可用都回 null
    /// </summary>
    private async Task<DownloadFileDto?> ResolveDownloadAsync(
        DownloadResourceSlot slot, DownloadResourceEntryDto entry, string extension, CancellationToken cancellationToken)
    {
        if (!slot.Extensions.Contains(extension)) return null;
        var id = entry.GetFileId(extension);
        if (id == null) return null;

        var file = await GetUsableFileAsync(id.Value, extension, cancellationToken);
        if (file == null) return null;

        return new DownloadFileDto
        {
            Kind = extension.TrimStart('.'),
            FileId = file.Id,
            FileName = file.OriginalFileName,
            FileSize = file.FileSize,
            FormattedFileSize = file.FormattedFileSize,
            Url = $"/api/FileManagement/{file.Id}/download",
        };
    }

    private async Task<ContributePageSettingsDto> LoadAsync(CancellationToken cancellationToken)
    {
        var result = await _settingService.GetSettingAsync<ContributePageSettingsDto>(ContributeKey, cancellationToken);
        return result.IsSuccess ? result.Data ?? new ContributePageSettingsDto() : new ContributePageSettingsDto();
    }

    /// <summary>
    /// 把檔案 id 換成可顯示／下載的資訊；檔案不存在、是資料夾、副檔名對不上（被改名）、
    /// 或是會員申請附件，一律視為「沒有這個格式」回 null
    /// </summary>
    private async Task<ContributeFormatFileDto?> ResolveFormatAsync(
        string kind, Guid? fileId, string extension, CancellationToken cancellationToken)
    {
        if (fileId == null) return null;

        var file = await GetUsableFileAsync(fileId.Value, extension, cancellationToken);
        if (file == null) return null;

        return new ContributeFormatFileDto
        {
            Kind = kind,
            FileId = file.Id,
            FileName = file.OriginalFileName,
            FileSize = file.FileSize,
            FormattedFileSize = file.FormattedFileSize,
            Url = $"/api/FileManagement/{file.Id}/download",
        };
    }

    private async Task<FileInfoResponse?> GetUsableFileAsync(Guid fileId, string extension, CancellationToken cancellationToken)
    {
        var info = await _fileService.GetFileByIdAsync(fileId, cancellationToken);
        if (!info.IsSuccess || info.Data == null) return null;

        var file = info.Data;
        if (file.IsFolder || file.Status != FileStatus.Active) return null;
        if (!string.Equals(NormalizeExtension(file.FileExtension), extension, StringComparison.OrdinalIgnoreCase)) return null;
        // 會員申請附件含申請人個資，不能拿來當公開下載檔（下載端點也會擋，這裡在源頭就不讓選）
        if (await _fileService.IsApplicationDocumentFileAsync(file.Id, cancellationToken)) return null;

        return file;
    }

    private async Task<string?> CheckFormatFileAsync(string label, Guid? fileId, string extension, CancellationToken cancellationToken)
    {
        if (fileId == null) return null;
        return await GetUsableFileAsync(fileId.Value, extension, cancellationToken) == null
            ? $"「{label}」必須選擇檔案管理中副檔名為 {extension} 的檔案（檔案不存在、是資料夾或副檔名不符）"
            : null;
    }

    private static string NormalizeExtension(string extension) =>
        extension.StartsWith('.') ? extension : "." + extension;
}
