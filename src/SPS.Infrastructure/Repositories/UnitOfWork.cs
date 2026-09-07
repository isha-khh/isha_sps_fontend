using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IRepositories;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 工作單元實現
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IUserRepository? _users;
    private IRoleRepository? _roles;
    private IMemberRepository? _members;
    private ICompanyRepository? _companies;
    private IApplicationRepository? _applications;
    private IApplicationMemberRepository? _applicationMembers;
    private IApplicationDocumentRepository? _applicationDocuments;
    private IApplicationLogRepository? _applicationLogs;
    private IFileRepository? _files;
    private IProductRepository? _products;
    private IDemandRepository? _demands;
    private IDemandNotificationRepository? _demandNotifications;
    private INewsRepository? _news;
    private ICategoryRepository? _categories;
    private IAttributeRepository? _attributes;
    private IMouRepository? _mous;
    private IAboutRepository? _about;
    private IQuestionRepository? _questions;
    private IRegulationsRepository? _regulations;
    private IMultilingualTextRepository? _multilingualTexts;
    private ISuccessCaseRepository? _successCases;
    private IBannerRepository? _banners;
    private IAlbumRepository? _albums;
    private IVideoRepository? _videos;
    private IPictureRepository? _pictures;
    private IProductFileRepository? _productFiles;
    private ITagRepository? _tags;
    private INotificationRepository? _notifications;
    private IFidoCredentialRepository? _fidoCredentials;
    private IPopupAnnouncementRepository? _popupAnnouncements;
    private ISiteCounterRepository? _siteCounter;
    private ISiteStatisticsRepository? _siteStatistics;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users
    {
        get
        {
            _users ??= new UserRepository(_context);
            return _users;
        }
    }

    public IRoleRepository Roles
    {
        get
        {
            _roles ??= new RoleRepository(_context);
            return _roles;
        }
    }

    public IMemberRepository Members
    {
        get
        {
            _members ??= new MemberRepository(_context);
            return _members;
        }
    }

    public ICompanyRepository Companies
    {
        get
        {
            _companies ??= new CompanyRepository(_context);
            return _companies;
        }
    }

    public IApplicationRepository Applications
    {
        get
        {
            _applications ??= new ApplicationRepository(_context);
            return _applications;
        }
    }

    public IApplicationMemberRepository ApplicationMembers
    {
        get
        {
            _applicationMembers ??= new ApplicationMemberRepository(_context);
            return _applicationMembers;
        }
    }

    public IApplicationDocumentRepository ApplicationDocuments
    {
        get
        {
            _applicationDocuments ??= new ApplicationDocumentRepository(_context);
            return _applicationDocuments;
        }
    }

    public IApplicationLogRepository ApplicationLogs
    {
        get
        {
            _applicationLogs ??= new ApplicationLogRepository(_context);
            return _applicationLogs;
        }
    }

    public IFileRepository Files
    {
        get
        {
            _files ??= new FileRepository(_context);
            return _files;
        }
    }

    public IProductRepository Products
    {
        get
        {
            _products ??= new ProductRepository(_context);
            return _products;
        }
    }

    public IDemandRepository Demands
    {
        get
        {
            _demands ??= new DemandRepository(_context);
            return _demands;
        }
    }

    public IDemandNotificationRepository DemandNotifications
    {
        get
        {
            _demandNotifications ??= new DemandNotificationRepository(_context);
            return _demandNotifications;
        }
    }

    public INewsRepository News
    {
        get
        {
            _news ??= new NewsRepository(_context);
            return _news;
        }
    }

    public ICategoryRepository Categories
    {
        get
        {
            _categories ??= new CategoryRepository(_context);
            return _categories;
        }
    }

    public IAttributeRepository Attributes
    {
        get
        {
            _attributes ??= new AttributeRepository(_context);
            return _attributes;
        }
    }

    public IMouRepository Mous
    {
        get
        {
            _mous ??= new MouRepository(_context);
            return _mous;
        }
    }

    public IAboutRepository About
    {
        get
        {
            _about ??= new AboutRepository(_context);
            return _about;
        }
    }

    public IQuestionRepository Questions
    {
        get
        {
            _questions ??= new QuestionRepository(_context);
            return _questions;
        }
    }

    public IRegulationsRepository Regulations
    {
        get
        {
            _regulations ??= new RegulationsRepository(_context);
            return _regulations;
        }
    }

    public IMultilingualTextRepository MultilingualTexts
    {
        get
        {
            _multilingualTexts ??= new MultilingualTextRepository(_context);
            return _multilingualTexts;
        }
    }

    private IAnalyticsRepository? _analytics;
    public IAnalyticsRepository Analytics
    {
        get
        {
            _analytics ??= new AnalyticsRepository(_context);
            return _analytics;
        }
    }

    private ISystemSettingRepository? _systemSettings;
    public ISystemSettingRepository SystemSettings
    {
        get
        {
            _systemSettings ??= new SystemSettingRepository(_context);
            return _systemSettings;
        }
    }

    public ISuccessCaseRepository SuccessCases
    {
        get
        {
            _successCases ??= new SuccessCaseRepository(_context);
            return _successCases;
        }
    }

    public IBannerRepository Banners
    {
        get
        {
            _banners ??= new BannerRepository(_context);
            return _banners;
        }
    }

    public IAlbumRepository Albums
    {
        get
        {
            _albums ??= new AlbumRepository(_context);
            return _albums;
        }
    }

    public IVideoRepository Videos
    {
        get
        {
            _videos ??= new VideoRepository(_context);
            return _videos;
        }
    }

    public IPictureRepository Pictures
    {
        get
        {
            _pictures ??= new PictureRepository(_context);
            return _pictures;
        }
    }

    public IProductFileRepository ProductFiles
    {
        get
        {
            _productFiles ??= new ProductFileRepository(_context);
            return _productFiles;
        }
    }

    public ITagRepository Tags
    {
        get
        {
            _tags ??= new TagRepository(_context);
            return _tags;
        }
    }

    public INotificationRepository Notifications
    {
        get
        {
            _notifications ??= new NotificationRepository(_context);
            return _notifications;
        }
    }

    public IFidoCredentialRepository FidoCredentials
    {
        get
        {
            _fidoCredentials ??= new FidoCredentialRepository(_context);
            return _fidoCredentials;
        }
    }

    public IPopupAnnouncementRepository PopupAnnouncements
    {
        get
        {
            _popupAnnouncements ??= new PopupAnnouncementRepository(_context);
            return _popupAnnouncements;
        }
    }

    public ISiteCounterRepository SiteCounter
    {
        get
        {
            _siteCounter ??= new SiteCounterRepository(_context);
            return _siteCounter;
        }
    }

    public ISiteStatisticsRepository SiteStatistics
    {
        get
        {
            _siteStatistics ??= new SiteStatisticsRepository(_context);
            return _siteStatistics;
        }
    }

    public DbContext GetDbContext() => _context;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}