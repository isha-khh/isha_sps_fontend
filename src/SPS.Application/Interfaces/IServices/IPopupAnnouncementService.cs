using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.PopupAnnouncement;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 彈窗公告服務接口
/// </summary>
public interface IPopupAnnouncementService
{
    /// <summary>
    /// 分頁查詢
    /// </summary>
    Task<Result<PagedResult<PopupAnnouncementListItemResponse>>> GetPagedAsync(
        PopupAnnouncementQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得詳情
    /// </summary>
    Task<Result<PopupAnnouncementResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增
    /// </summary>
    Task<Result<PopupAnnouncementResponse>> CreateAsync(
        CreatePopupAnnouncementRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新
    /// </summary>
    Task<Result<PopupAnnouncementResponse>> UpdateAsync(
        int id,
        UpdatePopupAnnouncementRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定路由的有效彈窗公告（前台用）
    /// </summary>
    Task<Result<List<PopupAnnouncementResponse>>> GetActiveByRouteAsync(
        string route,
        CancellationToken cancellationToken = default);
}
