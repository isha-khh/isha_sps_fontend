
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SPS.Application.Interfaces.IRepositories;

namespace SPS.Application.Interfaces;

/// <summary>
/// 工作單元接口
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// 後台使用者倉儲
    /// </summary>
    IUserRepository Users { get; }

    /// <summary>
    /// 角色倉儲
    /// </summary>
    IRoleRepository Roles { get; }

    /// <summary>
    /// 會員倉儲
    /// </summary>
    IMemberRepository Members { get; }

    /// <summary>
    /// 企業倉儲
    /// </summary>
    ICompanyRepository Companies { get; }

    /// <summary>
    /// 會員申請倉儲
    /// </summary>
    IApplicationRepository Applications { get; }

    /// <summary>
    /// 申請成員倉儲
    /// </summary>
    IApplicationMemberRepository ApplicationMembers { get; }

    /// <summary>
    /// 申請文件倉儲
    /// </summary>
    IApplicationDocumentRepository ApplicationDocuments { get; }

    /// <summary>
    /// 申請日志倉儲
    /// </summary>
    IApplicationLogRepository ApplicationLogs { get; }

    /// <summary>
    /// 文件倉儲
    /// </summary>
    IFileRepository Files { get; }

    /// <summary>
    /// 產品倉儲
    /// </summary>
    IProductRepository Products { get; }

    /// <summary>
    /// 需求倉儲
    /// </summary>
    IDemandRepository Demands { get; }
    IDemandNotificationRepository DemandNotifications { get; }

    /// <summary>
    /// 新聞倉儲
    /// </summary>
    INewsRepository News { get; }

    /// <summary>
    /// 分類倉儲
    /// </summary>
    ICategoryRepository Categories { get; }

    /// <summary>
    /// 屬性倉儲
    /// </summary>
    IAttributeRepository Attributes { get; }

    /// <summary>
    /// 合作備忘錄倉儲
    /// </summary>
    IMouRepository Mous { get; }

    /// <summary>
    /// 關於我們倉儲
    /// </summary>
    IAboutRepository About { get; }

    /// <summary>
    /// 常見問題倉儲
    /// </summary>
    IQuestionRepository Questions { get; }

    /// <summary>
    /// 法規倉儲
    /// </summary>
    IRegulationsRepository Regulations { get; }

    /// <summary>
    /// 網站分析倉儲
    /// </summary>
    IAnalyticsRepository Analytics { get; }

    /// <summary>
    /// 系統設定倉儲
    /// </summary>
    ISystemSettingRepository SystemSettings { get; }

    /// <summary>
    /// 多語言文本倉儲
    /// </summary>
    IMultilingualTextRepository MultilingualTexts { get; }

    /// <summary>
    /// 成功案例倉儲
    /// </summary>
    ISuccessCaseRepository SuccessCases { get; }

    /// <summary>
    /// Banner 倉儲
    /// </summary>
    IBannerRepository Banners { get; }

    /// <summary>
    /// 相簿倉儲
    /// </summary>
    IAlbumRepository Albums { get; }

    /// <summary>
    /// 影片倉儲
    /// </summary>
    IVideoRepository Videos { get; }

    /// <summary>
    /// 圖片倉儲
    /// </summary>
    IPictureRepository Pictures { get; }

    /// <summary>
    /// 產品文件倉儲
    /// </summary>
    IProductFileRepository ProductFiles { get; }

    /// <summary>
    /// 標籤倉儲
    /// </summary>
    ITagRepository Tags { get; }

    /// <summary>
    /// 通知倉儲
    /// </summary>
    INotificationRepository Notifications { get; }

    /// <summary>
    /// FIDO2 憑證倉儲
    /// </summary>
    IFidoCredentialRepository FidoCredentials { get; }

    /// <summary>
    /// 彈窗公告倉儲
    /// </summary>
    IPopupAnnouncementRepository PopupAnnouncements { get; }

    /// <summary>
    /// 網站計數器倉儲
    /// </summary>
    ISiteCounterRepository SiteCounter { get; }

    /// <summary>
    /// 網站統計數據倉儲
    /// </summary>
    ISiteStatisticsRepository SiteStatistics { get; }

    /// <summary>
    /// 取得 DbContext（用於需要直接操作多個 DbSet 的場景）
    /// </summary>
    DbContext GetDbContext();

    /// <summary>
    /// 保存更改
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 開始資料庫事務
    /// </summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
