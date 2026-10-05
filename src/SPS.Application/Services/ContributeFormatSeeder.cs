using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 部署時把「我要投稿」頁的投稿格式檔（ODF／PDF）seed 進頁面設定。
///
/// 做法：把檔案放進專案的 <c>SPS.Api/wwwroot/seed/contribute/</c>（.docx、.odt、.pdf 各一個，檔名自訂，建議用英文）。
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

    /// <summary>使用者下載到的檔名（不含副檔名）。磁碟上的檔名是英文，這裡統一換成中文顯示名稱</summary>
    public const string DisplayName = "電子報投稿格式";

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

        // (副檔名, 目前設定的檔案 id / seed 標記的存取方式)；三種格式的規則完全相同
        var slots = new (string Extension, Func<Guid?> GetId, Action<Guid?> SetId, Func<string?> GetHash, Action<string?> SetHash)[]
        {
            (".docx", () => settings.DocxFileId, v => settings.DocxFileId = v, () => settings.DocxSeedHash, v => settings.DocxSeedHash = v),
            (".odt", () => settings.OdtFileId, v => settings.OdtFileId = v, () => settings.OdtSeedHash, v => settings.OdtSeedHash = v),
            (".pdf", () => settings.PdfFileId, v => settings.PdfFileId = v, () => settings.PdfSeedHash, v => settings.PdfSeedHash = v),
        };

        var applied = new List<string>();
        foreach (var slot in slots)
        {
            var file = seedFiles.FirstOrDefault(f => string.Equals(f.FileExtension, slot.Extension, StringComparison.OrdinalIgnoreCase));
            if (file == null) continue;
            // 這個版本已經 seed 過：不動（管理員在後台改選或移除的結果要保留）
            if (string.Equals(slot.GetHash(), file.FileHash, StringComparison.OrdinalIgnoreCase)) continue;

            // 下載時顯示的檔名用固定的中文名稱，不用磁碟上的檔名：磁碟上的檔名刻意用英文（避開中文檔名在
            // 不同作業系統／Docker／網址的編碼問題），使用者下載到的卻應該是看得懂的名稱
            file.OriginalFileName = DisplayName + slot.Extension;
            file.UpdatedTime = DateTime.UtcNow;
            await _unitOfWork.Files.UpdateAsync(file, cancellationToken);

            slot.SetId(file.Id);
            slot.SetHash(file.FileHash);
            applied.Add(file.StaticFilePath ?? file.OriginalFileName);
            changed = true;
        }

        if (!changed) return;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var saved = await _settingService.UpdateSettingAsync(ContributeSettingKey, settings, cancellationToken);
        if (saved.IsSuccess)
            _logger.LogInformation("已把 seed 的投稿格式檔套用到頁面設定：{Files}", string.Join(", ", applied));
        else
            _logger.LogWarning("套用 seed 的投稿格式檔失敗: {Error}", saved.Error);
    }
}
