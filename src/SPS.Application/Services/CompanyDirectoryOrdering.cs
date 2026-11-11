using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.SystemSettings;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>
/// 前台企業名錄的排序（後台「內容管理 → 頁面設定 → 企業名錄排序」）：規則依優先順序逐條套用，前面分不出高下才看下一條；
/// 最後固定補「新的在前」與編號，換頁時順序才穩定。沒有任何啟用的規則＝只有這兩條。
/// 企業名錄列表（<c>CompanyRepository</c>）與全站搜尋的企業結果共用這一份，兩邊的順序才會一致。
/// </summary>
public static class CompanyDirectoryOrdering
{
    public static IQueryable<Company> Apply(IQueryable<Company> query, List<EnterpriseSortRuleDto> rules, DbContext db)
    {
        IOrderedQueryable<Company>? ordered = null;
        var usedNewest = false;

        IOrderedQueryable<Company> Add<TKey>(System.Linq.Expressions.Expression<Func<Company, TKey>> key, bool descending)
            => ordered == null
                ? (descending ? query.OrderByDescending(key) : query.OrderBy(key))
                : (descending ? ordered.ThenByDescending(key) : ordered.ThenBy(key));

        foreach (var rule in rules)
        {
            switch (rule.Key)
            {
                case EnterpriseDirectorySortKeys.Completeness:
                    // 基本資料有填的欄位數（簡介、主要產品暨服務、電話、地址、網址、成立日期、資本總額），圖片與標籤另有各自的依據
                    ordered = Add(c =>
                        (c.Introduction != null && c.Introduction != "" ? 1 : 0) +
                        (c.Subject != null && c.Subject != "" ? 1 : 0) +
                        (c.Phone != null && c.Phone != "" ? 1 : 0) +
                        (c.AddressId != null ? 1 : 0) +
                        (c.OrgUrl != null && c.OrgUrl != "" ? 1 : 0) +
                        (c.EstablishmentDate != null && c.EstablishmentDate != "" ? 1 : 0) +
                        (c.Revenue != null ? 1 : 0), rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Image:
                    ordered = Add(c => c.PhotoId != null ? 1 : 0, rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Tags:
                    ordered = Add(c => db.Set<CompanyTagCategory>().Count(t => t.CompanyId == c.Id), rule.Descending);
                    break;
                case EnterpriseDirectorySortKeys.Newest:
                    ordered = Add(c => c.CreatedTime, rule.Descending);
                    usedNewest = true;
                    break;
            }
        }

        if (!usedNewest) ordered = Add(c => c.CreatedTime, true);
        return Add(c => c.Id, true);
    }

    /// <summary>已啟用的排序規則（讀後台設定，沒設定過＝只有「新舊（新的在前）」）</summary>
    public static async Task<List<EnterpriseSortRuleDto>> LoadEnabledRulesAsync(
        SPS.Application.Interfaces.IServices.ISystemSettingService settingService, CancellationToken ct = default)
    {
        var sort = await settingService.GetSettingAsync<EnterpriseDirectorySortSettingsDto>(EnterpriseDirectorySortKeys.SettingCategory, ct);
        var settings = sort.IsSuccess && sort.Data != null ? sort.Data : new EnterpriseDirectorySortSettingsDto();
        return EnterpriseDirectorySortValidator.Normalize(settings).Settings.Rules.Where(r => r.Enabled).ToList();
    }
}
