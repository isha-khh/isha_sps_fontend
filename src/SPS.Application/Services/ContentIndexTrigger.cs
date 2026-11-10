using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>
/// 內容異動後觸發語意索引（全站搜尋用）：公告類、常見問題、產業案例新增或修改後，
/// 在背景用新的 DI scope 重建那一筆的向量，避免呼叫端 request 結束後 DbContext 被 dispose。
/// 失敗只記 log，不影響儲存本身——排程掃描會補上沒有向量或失敗待重試的項目。
/// 語意搜尋沒啟用時 <see cref="IContentIndexingService"/> 的呼叫會直接失敗並記 log，不會影響儲存。
/// </summary>
public interface IContentIndexTrigger
{
    void Trigger(EmbeddingSourceType sourceType, string sourceId);
}

public class ContentIndexTrigger : IContentIndexTrigger
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ContentIndexTrigger> _logger;

    public ContentIndexTrigger(IServiceScopeFactory scopeFactory, ILogger<ContentIndexTrigger> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Trigger(EmbeddingSourceType sourceType, string sourceId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();
                await indexingService.IndexAsync(sourceType, sourceId, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "{SourceType} {SourceId} 語意索引失敗（將由排程掃描重試）", sourceType, sourceId);
            }
        });
    }
}
