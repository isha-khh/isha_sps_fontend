using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSetting");

        builder.HasIndex(x => x.Category).IsUnique();

        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(50);

        // 指定映射為 jsonb 類型
        builder.Property(x => x.Value)
            .HasColumnType("jsonb")
            .IsRequired();
    }
}
