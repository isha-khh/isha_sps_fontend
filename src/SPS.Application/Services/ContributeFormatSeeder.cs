using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 部署時把「我要投稿」頁的投稿格式檔（ODF／PDF）seed 進頁面設定。
///
/// 做法：把檔案放進專案的 <c>SPS.Api/wwwroot/seed/contribute/</c>（一個 .odt、一個 .pdf，檔名自訂）。
/// 隨 API 一起發佈後，啟動時靜態檔案掃描會把它們登錄進檔案管理，這裡再把它們設成頁面設定的投稿格式。
///
/// 不會蓋掉後台的操作：只有在 seed 檔案「內容變了」（雜湊和上次 seed 的不同，或從來沒 seed 過）才會套用。
/// 所以後台把格式改選別的檔案、或移除之後，重啟不會被改回來；而之後把新版範本換進 seed 資料夾
/// 再部署，就會自動更新成新版。
/// </summary>
public class ContributeFormatSeeder
{
    public const string ContributeSettingKey = "PageContribute";
    public const string SeedFolder = "seed/contribute/";

    private readonly IUnitOfWork _unitOfWork;
    private readonly ISystemSettingService _settingService;
    private readonly ILogger<ContributeFormatSeeder> _logger;

    public ContributeFormatSeeder(
        IUnitOfWork unitOfWork,
        ISystemSettingService settingService,
        ILogger<ContributeFormatSeeder> logger)
    {
        _unitOfWork = unitOfWork;
        _settingService = settingService;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var seedFiles = (await _unitOfWork.Files.GetStaticFilesByPathPrefixAsync(SeedFolder, cancellationToken))
            .Where(f => f.Status == FileStatus.Active && !f.IsFolder)
            .OrderBy(f => f.StaticFilePath, StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (seedFiles.Count == 0) return;

        var loaded = await _settingService.GetSettingAsync<ContributePageSettingsDto>(ContributeSettingKey, cancellationToken);
        var settings = loaded.IsSuccess ? loaded.Data ?? new ContributePageSettingsDto() : new ContributePageSettingsDto();

        var changed = false;

        var odt = seedFiles.FirstOrDefault(f => string.Equals(f.FileExtension, ".odt", StringComparison.OrdinalIgnoreCase));
        if (odt != null && !string.Equals(settings.OdtSeedHash, odt.FileHash, StringComparison.OrdinalIgnoreCase))
        {
            settings.OdtFileId = odt.Id;
            settings.OdtSeedHash = odt.FileHash;
            changed = true;
        }

        var pdf = seedFiles.FirstOrDefault(f => string.Equals(f.FileExtension, ".pdf", StringComparison.OrdinalIgnoreCase));
        if (pdf != null && !string.Equals(settings.PdfSeedHash, pdf.FileHash, StringComparison.OrdinalIgnoreCase))
        {
            settings.PdfFileId = pdf.Id;
            settings.PdfSeedHash = pdf.FileHash;
            changed = true;
        }

        if (!changed) return;

        var saved = await _settingService.UpdateSettingAsync(ContributeSettingKey, settings, cancellationToken);
        if (saved.IsSuccess)
            _logger.LogInformation("已把 seed 的投稿格式檔套用到頁面設定（ODF: {Odt}, PDF: {Pdf}）",
                odt?.OriginalFileName ?? "-", pdf?.OriginalFileName ?? "-");
        else
            _logger.LogWarning("套用 seed 的投稿格式檔失敗: {Error}", saved.Error);
    }
}
