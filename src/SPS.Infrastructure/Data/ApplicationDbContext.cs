using Microsoft.EntityFrameworkCore;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Core Entities
    public DbSet<Company> Companies { get; set; } = null!;
    public DbSet<Member> Members { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Person> Persons { get; set; } = null!;
    public DbSet<Address> Addresses { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;

    // Product & Demand Entities
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Demand> Demands { get; set; } = null!;

    // Unified Category & Tag Entities
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<EntityTag> EntityTags { get; set; } = null!;
    public DbSet<CompanyTagCategory> CompanyTagCategories { get; set; } = null!;
    public DbSet<DemandTagCategory> DemandTagCategories { get; set; } = null!;
    public DbSet<DemandNotification> DemandNotifications { get; set; } = null!;

    // Attribute Entities
    public DbSet<SPS.Domain.Entities.Attribute> Attributes { get; set; } = null!;
    public DbSet<AttributeValue> AttributeValues { get; set; } = null!;
    public DbSet<EntityAttributeValue> EntityAttributeValues { get; set; } = null!;

    // Member Relations
    public DbSet<MemberFavorite> MemberFavorites { get; set; } = null!;
    public DbSet<MemberDemand> MemberDemands { get; set; } = null!;

    // Member Application Entities
    public DbSet<MemberApplication> MemberApplications { get; set; } = null!;
    public DbSet<ApplicationMember> ApplicationMembers { get; set; } = null!;
    public DbSet<ApplicationDocument> ApplicationDocuments { get; set; } = null!;
    public DbSet<ApplicationLog> ApplicationLogs { get; set; } = null!;

    // News & Content Entities
    public DbSet<News> News { get; set; } = null!;
    public DbSet<PopupAnnouncement> PopupAnnouncements { get; set; } = null!;
    public DbSet<SiteCounter> SiteCounters { get; set; } = null!;
    public DbSet<SiteStatistics> SiteStatistics { get; set; } = null!;
    public DbSet<About> Abouts { get; set; } = null!;
    public DbSet<Question> Questions { get; set; } = null!;
    public DbSet<Regulations> Regulations { get; set; } = null!;
    public DbSet<Mou> Mous { get; set; } = null!;
    public DbSet<SuccessCase> SuccessCases { get; set; } = null!;

    // Chat & File Entities
    public DbSet<ChatRecord> ChatRecords { get; set; } = null!;
    public DbSet<Messages> Messages { get; set; } = null!;
    public DbSet<SPS.Domain.Entities.File> Files { get; set; } = null!;
    public DbSet<Document> Documents { get; set; } = null!;
    public DbSet<Scoring> Scorings { get; set; } = null!;

    // File Management
    public DbSet<UploadedFile> UploadedFiles { get; set; } = null!;

    // Media Entities
    public DbSet<Picture> Pictures { get; set; } = null!;
    public DbSet<MultilingualImage> MultilingualImages { get; set; } = null!;
    public DbSet<MultilingualText> MultilingualTexts { get; set; } = null!;
    public DbSet<StringResource> StringResources { get; set; } = null!;
    public DbSet<Album> Albums { get; set; } = null!;
    public DbSet<Video> Videos { get; set; } = null!;

    // Banner Entities
    public DbSet<Banner> Banners { get; set; } = null!;
    public DbSet<BannerPosition> BannerPositions { get; set; } = null!;

    // System Entities
    public DbSet<AnalyticsDailyMetric> AnalyticsDailyMetrics { get; set; } = null!;
    public DbSet<AnalyticsDimensionStatistic> AnalyticsDimensionStatistics { get; set; } = null!;
    public DbSet<SystemSetting> SystemSettings { get; set; } = null!;
    public DbSet<Culture> Cultures { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<VerificationRecord> VerificationRecords { get; set; } = null!;
    public DbSet<PasswordChangeLog> PasswordChangeLogs { get; set; } = null!;
    public DbSet<ActionLog> ActionLogs { get; set; } = null!;
    public DbSet<Sequence> Sequences { get; set; } = null!;
    public DbSet<Resource> Resources { get; set; } = null!;
    public DbSet<RelationLink> RelationLinks { get; set; } = null!;
    public DbSet<MailLog> MailLogs { get; set; } = null!;
    public DbSet<EmailCampaign> EmailCampaigns { get; set; } = null!;
    public DbSet<EmailCampaignRecipient> EmailCampaignRecipients { get; set; } = null!;
    public DbSet<EmailCampaignAttachment> EmailCampaignAttachments { get; set; } = null!;

    // FIDO2 WebAuthn
    public DbSet<FidoCredential> FidoCredentials { get; set; } = null!;

    // AI 向量媒合搜尋
    public DbSet<ContentEmbedding> ContentEmbeddings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // pgvector 擴充（AI 向量媒合搜尋用）
        modelBuilder.HasPostgresExtension("vector");

        // Apply all configurations from the assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
