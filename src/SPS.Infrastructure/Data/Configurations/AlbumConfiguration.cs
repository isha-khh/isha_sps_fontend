using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class AlbumConfiguration : IEntityTypeConfiguration<Album>
{
    public void Configure(EntityTypeBuilder<Album> builder)
    {
        builder.ToTable("Album");

        builder.HasOne(a => a.Cover)
            .WithMany()
            .HasForeignKey(a => a.CoverId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
