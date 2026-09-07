using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Company");

        builder.Property(c => c.Number)
            .HasMaxLength(36)
            .IsRequired();

        builder.Property(c => c.Revenue)
            .HasPrecision(18, 2);

        builder.Property(c => c.ContactPerson)
            .HasMaxLength(100);

        builder.Property(c => c.MemberRole)
            .HasConversion<int>();

        builder.HasOne(c => c.Photo)
            .WithMany(p => p.CompaniesWithPhoto)
            .HasForeignKey(c => c.PhotoId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(c => c.Banner)
            .WithMany(p => p.CompaniesWithBanner)
            .HasForeignKey(c => c.BannerId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
