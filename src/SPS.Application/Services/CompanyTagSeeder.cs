using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 企業標籤（應用情境／應用範疇／智慧技術）的初始資料。
///
/// 前台的篩選面板、註冊與會員中心的標籤勾選、企業詳情的標籤分類，全部以資料庫裡「企業標籤」分類
/// （<see cref="CategoryType.CompanyTag"/>）為準；全新的資料庫沒有任何標籤時，這些畫面都會是空的，
/// 供給端也沒有標籤可勾（註冊要求至少勾一個）。所以<b>只有在完全沒有企業標籤時</b>才會匯入內建的標籤樹
/// （<c>Resources/company-tags.json</c>，113 筆，是設計定案的三組分類與智慧技術的大類／子分類／項目），
/// 已經有任何一筆標籤就一律不動——管理員在後台新增、改名、刪除的標籤不會被改回來。
///
/// 標籤樹的根節點的 <c>remark</c> 是「應用情境」「應用範疇」或「智慧技術」，前台靠它決定這個標籤屬於哪一組。
/// </summary>
public class CompanyTagSeeder
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompanyTagSeeder> _logger;

    public CompanyTagSeeder(IUnitOfWork unitOfWork, ILogger<CompanyTagSeeder> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    private sealed class TagNode
    {
        public string Name { get; set; } = string.Empty;
        public string? Remark { get; set; }
        public int Ordinal { get; set; }
        public bool Published { get; set; } = true;
        public List<TagNode>? Children { get; set; }
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var db = _unitOfWork.GetDbContext();
        if (await db.Set<Category>().AnyAsync(c => c.Type == CategoryType.CompanyTag, cancellationToken)) return;

        var assembly = typeof(CompanyTagSeeder).Assembly;
        var resourceName = assembly.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith("company-tags.json", StringComparison.OrdinalIgnoreCase));
        if (resourceName == null)
        {
            _logger.LogWarning("找不到內建的企業標籤資料（company-tags.json），略過標籤初始化");
            return;
        }

        List<TagNode>? roots;
        await using (var stream = assembly.GetManifestResourceStream(resourceName)!)
        {
            roots = await JsonSerializer.DeserializeAsync<List<TagNode>>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, cancellationToken);
        }

        if (roots == null || roots.Count == 0) return;

        var created = 0;
        // 一層一層建：先建好上一層才拿得到 ParentId
        var level = roots.Select(n => (Node: n, ParentId: (int?)null)).ToList();
        while (level.Count > 0)
        {
            var entities = new List<(TagNode Node, Category Entity)>();
            foreach (var (node, parentId) in level)
            {
                var entity = new Category
                {
                    Type = CategoryType.CompanyTag,
                    DataMode = DataMode.Normal,
                    Name = node.Name,
                    Remark = node.Remark,
                    Ordinal = node.Ordinal,
                    Published = node.Published,
                    ParentId = parentId,
                    HasChild = node.Children is { Count: > 0 },
                    CreatedTime = DateTime.UtcNow,
                    UpdatedTime = DateTime.UtcNow,
                };
                db.Set<Category>().Add(entity);
                entities.Add((node, entity));
            }

            await db.SaveChangesAsync(cancellationToken);
            created += entities.Count;

            level = entities
                .SelectMany(e => (e.Node.Children ?? new List<TagNode>()).Select(child => (Node: child, ParentId: (int?)e.Entity.Id)))
                .ToList();
        }

        _logger.LogInformation("資料庫沒有任何企業標籤，已匯入內建的企業標籤 {Count} 筆（應用情境、應用範疇、智慧技術）", created);
    }
}
