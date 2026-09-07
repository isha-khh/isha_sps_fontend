using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class CultureConfiguration : IEntityTypeConfiguration<Culture>
{
    public void Configure(EntityTypeBuilder<Culture> builder)
    {
        builder.ToTable("Culture");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(c => c.Name)
            .HasMaxLength(64)
            .IsRequired();
    }
}
