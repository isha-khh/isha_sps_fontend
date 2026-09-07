using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class NewsConfiguration : IEntityTypeConfiguration<News>
{
    public void Configure(EntityTypeBuilder<News> builder)
    {
        builder.ToTable("News");

        builder.HasOne(n => n.Title)
            .WithMany(mt => mt.NewsTitles)
            .HasForeignKey(n => n.TitleId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Introduction)
            .WithMany(mt => mt.NewsIntroductions)
            .HasForeignKey(n => n.IntroductionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Content)
            .WithMany(mt => mt.NewsContents)
            .HasForeignKey(n => n.ContentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Picture)
            .WithMany(mi => mi.News)
            .HasForeignKey(n => n.PictureId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
