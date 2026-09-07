using Microsoft.Extensions.DependencyInjection;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services;

namespace SPS.Application;

/// <summary>
/// Application 层依赖注入配置
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // 注册服务
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminAuthService, AdminAuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminRoleService, AdminRoleService>();
        services.AddScoped<IApplicationService, ApplicationService>();
        services.AddScoped<IApplicationReviewService, ApplicationReviewService>();
        services.AddScoped<IFileManagementService, FileManagementService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IDemandService, DemandService>();
        services.AddScoped<IContentIndexingService, ContentIndexingService>();
        services.AddScoped<INewsService, NewsService>();
        services.AddScoped<IPopupAnnouncementService, PopupAnnouncementService>();
        services.AddScoped<ISiteCounterService, SiteCounterService>();
        services.AddScoped<ISiteStatisticsService, SiteStatisticsService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IAboutService, AboutService>();
        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<IRegulationsService, RegulationsService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<ISystemSettingService, SystemSettingService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IMemberService, MemberService>();
        services.AddScoped<IMemberProfileService, MemberProfileService>();
        services.AddScoped<IBannerService, BannerService>();
        services.AddScoped<IAlbumService, AlbumService>();
        services.AddScoped<IVideoService, VideoService>();
        services.AddScoped<IPictureService, PictureService>();
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IFido2Service, Fido2Service>();
        services.AddScoped<IPasswordPolicyService, PasswordPolicyService>();

        // 註冊背景服務
        services.AddHostedService<FileCleanupService>();

        return services;
    }
}
