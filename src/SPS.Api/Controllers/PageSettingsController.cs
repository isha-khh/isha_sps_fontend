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
        });
    }

    /// <summary>
    /// 更新「我要投稿」頁設定。投稿格式檔必須是檔案管理系統裡真的存在、副檔名對得上的檔案
    /// （ODF＝.odt、PDF＝.pdf），不能是資料夾或會員申請附件
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

        // seed 標記是內部欄位，後台畫面不會送；沿用資料庫裡現有的值，否則每次儲存都會把標記清掉，
        // 下次重啟就會把 seed 檔又套回來、蓋掉管理員剛剛的選擇
        var normalized = ContributePageValidator.Normalize(settings);
        var existing = await LoadAsync(cancellationToken);
        normalized.OdtSeedHash = existing.OdtSeedHash;
        normalized.PdfSeedHash = existing.PdfSeedHash;

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

        var formats = new List<ContributeFormatFileDto>();
        var odt = await ResolveFormatAsync("odt", settings.OdtFileId, ".odt", cancellationToken);
        var pdf = await ResolveFormatAsync("pdf", settings.PdfFileId, ".pdf", cancellationToken);
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
