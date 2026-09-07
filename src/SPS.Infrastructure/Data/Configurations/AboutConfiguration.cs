using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class AboutConfiguration : IEntityTypeConfiguration<About>
{
    public void Configure(EntityTypeBuilder<About> builder)
    {
        builder.ToTable("About");

        builder.HasOne(a => a.Title)
            .WithMany(mt => mt.AboutTitles)
            .HasForeignKey(a => a.TitleId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(a => a.Content)
            .WithMany(mt => mt.AboutContents)
            .HasForeignKey(a => a.ContentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(a => a.Picture)
            .WithMany(mi => mi.Abouts)
            .HasForeignKey(a => a.PictureId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
