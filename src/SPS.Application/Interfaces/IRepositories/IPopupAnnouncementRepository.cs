using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.PopupAnnouncement;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 彈窗公告倉儲接口
/// </summary>
public interface IPopupAnnouncementRepository : IRepository<PopupAnnouncement, int>
{
    /// <summary>
    /// 分頁查詢
    /// </summary>
    Task<PagedResult<PopupAnnouncement>> GetPagedAsync(
        PopupAnnouncementQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定路由的有效彈窗公告
    /// </summary>
    Task<List<PopupAnnouncement>> GetActiveByRouteAsync(
        string route,
        CancellationToken cancellationToken = default);
}
