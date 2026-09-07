using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ApplicationLogConfiguration : IEntityTypeConfiguration<ApplicationLog>
{
    public void Configure(EntityTypeBuilder<ApplicationLog> builder)
    {
        builder.ToTable("ApplicationLog");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Action)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(l => l.Comment)
            .HasMaxLength(1000);

        builder.Property(l => l.IpAddress)
            .HasMaxLength(50);

        builder.HasIndex(l => l.ApplicationId);

        builder.HasIndex(l => l.OperatedAt);
    }
}
