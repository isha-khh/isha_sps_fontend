using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IRepositories;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Interceptors;
using SPS.Infrastructure.Repositories;
using SPS.Infrastructure.Services;

namespace SPS.Infrastructure;

/// <summary>
/// Infrastructure 層依賴注入配置
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 數據庫上下文
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b =>
                {
                    b.MigrationsAssembly("SPS.Infrastructure");
                    // 使用 SplitQuery 避免多個 Include 造成的 Cartesian explosion
                    b.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    // 啟用 pgvector 型別支援（AI 向量媒合搜尋）
                    b.UseVector();
                });

            // 加入審計日誌攔截器
            var interceptor = sp.GetService<AuditLogInterceptor>();
            if (interceptor != null)
            {
                options.AddInterceptors(interceptor);
            }
        });

        // 工作單元
        services.AddScoped<IUnitOfWork, UnitOfWork>();


        // 倉儲
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IApplicationRepository, ApplicationRepository>();
        services.AddScoped<IApplicationMemberRepository, ApplicationMemberRepository>();
        services.AddScoped<IApplicationDocumentRepository, ApplicationDocumentRepository>();
        services.AddScoped<IApplicationLogRepository, ApplicationLogRepository>();
        services.AddScoped<IFileRepository, FileRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IDemandRepository, DemandRepository>();
        services.AddScoped<INewsRepository, NewsRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IAboutRepository, AboutRepository>();
        services.AddScoped<IQuestionRepository, QuestionRepository>();
        services.AddScoped<IRegulationsRepository, RegulationsRepository>();
        services.AddScoped<IMultilingualTextRepository, MultilingualTextRepository>();
        services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
        services.AddScoped<IFidoCredentialRepository, FidoCredentialRepository>();


        // HTTP Client
        services.AddHttpClient();

        // ProTrack 使用 SocketsHttpHandler 繞過 macOS Apple TLS 限制（bad protocol version）
        services.AddHttpClient("ProTrack")
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                SslOptions = new System.Net.Security.SslClientAuthenticationOptions
                {
                    EnabledSslProtocols =
                        System.Security.Authentication.SslProtocols.Tls12 |
                        System.Security.Authentication.SslProtocols.Tls13
                }
            });

        // LiteLLM（AI 語意搜尋 embedding 呼叫）
        services.AddHttpClient("Embedding", c => c.Timeout = TimeSpan.FromSeconds(30));

        // 服務
        services.AddScoped<IMouService, MouService>();
        services.AddScoped<IAttributeService, AttributeService>();
        services.AddScoped<ISuccessCaseService, SuccessCaseService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IBusinessRegistryService, BusinessRegistryService>();
        services.AddScoped<IGoogleAnalyticsProvider, GoogleAnalyticsProvider>();

        // FIDO2（DB 優先、環境變數/appsettings 兜底）
        services.AddScoped<IFido2Provider, Fido2Provider>();

        // Redis 配置
        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
            StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnection));

        // 聊天服務
        services.AddScoped<IChatRedisService, ChatRedisService>();
        services.AddScoped<IMemberChatRedisService, MemberChatRedisService>();
        services.AddScoped<IMemberChatService, MemberChatService>();
        services.AddScoped<IChatPersistenceService>(sp =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Database connection string not configured");
            return new ChatPostgresService(connectionString);
        });

        // 郵件服務
        var emailSection = configuration.GetSection("Email_Setting");
        services.Configure<EmailSettings>(emailSection);
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IMailCampaignService, MailCampaignService>();

        // ProTrack 整合服務
        services.AddScoped<IProTrackService, ProTrackService>();
        services.AddScoped<IEmbeddingService, EmbeddingService>();

        // 驗證碼服務
        services.AddScoped<IVerificationCodeService, VerificationCodeService>();

        // 操作日誌服務
        services.AddScoped<IActionLogService, ActionLogService>();

        // CAPTCHA 服務
        services.AddScoped<ICaptchaService, CaptchaService>();

        // Redis Distributed Cache (for FIDO2 challenge sessions)
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
            options.InstanceName = "sps:";
        });

        // Memory Cache (for settings caching)
        services.AddMemoryCache();

        // HTTP 安全性設定提供者 (使用 Scoped 因為依賴 ISystemSettingService)
        services.AddScoped<IHttpSecuritySettingsProvider, HttpSecuritySettingsProvider>();

        // Nginx 重新載入服務
        services.AddScoped<NginxReloadService>();

        // 文件存儲服務
        var fileStorageSection = configuration.GetSection("FileStorage");
        services.Configure<FileStorageSettings>(fileStorageSection);
        services.AddScoped<IFileStorageProvider, LocalFileStorageProvider>();

        // 資料庫序列修復服務 (啟動時檢查並修復 Identity Sequence)
        services.AddHostedService<DatabaseSequenceFixerService>();

        // 靜態檔案掃描服務 (系統啟動時自動掃描 wwwroot)
        services.AddHostedService<StaticFileScannerService>();

        // Nginx 設定檔初始化服務 (啟動時產生 security headers config)
        services.AddHostedService<NginxConfigInitializerService>();

        // 退信處理服務
        services.AddScoped<BounceProcessingService>();
        services.AddHostedService<BounceProcessingBackgroundService>();

        // 群發郵件背景處理
        services.AddHostedService<MailCampaignProcessingBackgroundService>();

        // AI 向量媒合索引排程掃描
        services.AddHostedService<IndexReconciliationBackgroundService>();

        return services;
    }
}