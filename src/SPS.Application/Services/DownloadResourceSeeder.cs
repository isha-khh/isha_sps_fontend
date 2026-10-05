using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 部署時把「下載資源」的檔案 seed 進頁面設定（會員註冊的申請須知與附件、補助專區的五份文件…）。
///
/// 做法：把檔案放進專案的 <c>SPS.Api/wwwroot/seed/</c>，路徑與檔名照 <see cref="DownloadResourceCatalog"/>
/// 裡每個項目的 <c>SeedPath</c>（例如 <c>seed/register/consent-form.docx</c>）。檔名刻意用英文
/// （避開中文檔名在不同作業系統／Docker／網址的編碼風險）；使用者下載到的檔名由這裡統一設成目錄裡的中文顯示名稱。
///
/// 規則與 <see cref="ContributeFormatSeeder"/> 相同：某個檔案「這個版本還沒 seed 過」才套用（以內容雜湊判斷），
/// 所以管理員在後台改選別的檔案、設了外部連結或移除之後，重啟不會被改回來；之後用同檔名換進新版再部署，
/// 才會自動更新成新版。沒有放 seed 檔案的項目不受影響。
/// </summary>
public class DownloadResourceSeeder
{
    public const string SettingKey = "DownloadResources";
    private const string SeedRoot = "seed/";

    private readonly IUnitOfWork _unitOfWork;
    private readonly ISystemSettingService _settingService;
    private readonly ILogger<DownloadResourceSeeder> _logger;

    public DownloadResourceSeeder(
        IUnitOfWork unitOfWork,
        ISystemSettingService settingService,
        ILogger<DownloadResourceSeeder> logger)
    {
        _unitOfWork = unitOfWork;
        _settingService = settingService;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var staticFiles = (await _unitOfWork.Files.GetStaticFilesByPathPrefixAsync(SeedRoot, cancellationToken))
            .Where(f => f.Status == FileStatus.Active && !f.IsFolder && f.StaticFilePath != null)
            .ToDictionary(f => f.StaticFilePath!, f => f, StringComparer.OrdinalIgnoreCase);
        if (staticFiles.Count == 0) return;

        var loaded = await _settingService.GetSettingAsync<DownloadResourcesSettingsDto>(SettingKey, cancellationToken);
        var settings = loaded.IsSuccess ? loaded.Data ?? new DownloadResourcesSettingsDto() : new DownloadResourcesSettingsDto();

        var applied = new List<string>();

        foreach (var slot in DownloadResourceCatalog.Slots)
        {
            if (slot.SeedPath == null) continue;

            foreach (var extension in slot.Extensions)
            {
                if (!staticFiles.TryGetValue($"{SeedRoot}{slot.SeedPath}{extension}", out var file)) continue;

                settings.Items.TryGetValue(slot.Key, out var entry);
                // 這個版本已經 seed 過：不動（管理員在後台改選、設外部連結或移除的結果要保留）
                if (entry != null && string.Equals(entry.GetSeedHash(extension), file.FileHash, StringComparison.OrdinalIgnoreCase))
                    continue;

                entry ??= settings.Items[slot.Key] = new DownloadResourceEntryDto();

                // 下載時顯示中文檔名；磁碟上的英文檔名只是為了避開編碼問題
                if (!string.IsNullOrEmpty(slot.DisplayName))
                {
                    file.OriginalFileName = slot.DisplayName + extension;
                    file.UpdatedTime = DateTime.UtcNow;
                    await _unitOfWork.Files.UpdateAsync(file, cancellationToken);
                }

                entry.SetFileId(extension, file.Id);
                entry.SetSeedHash(extension, file.FileHash);
                applied.Add(file.StaticFilePath!);
            }
        }

        if (applied.Count == 0) return;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await _settingService.UpdateSettingAsync(SettingKey, settings, cancellationToken);
        if (saved.IsSuccess)
            _logger.LogInformation("已把 seed 的下載資源檔案套用到頁面設定（{Count} 個）：{Files}", applied.Count, string.Join(", ", applied));
        else
            _logger.LogWarning("套用 seed 的下載資源檔案失敗: {Error}", saved.Error);
    }
}
