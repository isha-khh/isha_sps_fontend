using SPS.Application.Common;
using SPS.Application.DTOs.Search;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 全站搜尋：一次查公告、常見問題、產業案例、影音，只含已發布的公開內容。
/// </summary>
public interface ISearchService
{
    Task<Result<SearchResponse>> SearchAsync(string keyword, int limitPerGroup, CancellationToken cancellationToken = default);
}
