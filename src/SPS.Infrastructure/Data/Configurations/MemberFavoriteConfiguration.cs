using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MemberFavoriteConfiguration : IEntityTypeConfiguration<MemberFavorite>
{
    public void Configure(EntityTypeBuilder<MemberFavorite> builder)
    {
        builder.ToTable("MemberFavorite");

        builder.HasKey(mf => new { mf.MemberId, mf.CompanyId });

        builder.HasOne(mf => mf.Member)
            .WithMany(m => m.Favorites)
            .HasForeignKey(mf => mf.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(mf => mf.Company)
            .WithMany(c => c.MemberFavorites)
            .HasForeignKey(mf => mf.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
