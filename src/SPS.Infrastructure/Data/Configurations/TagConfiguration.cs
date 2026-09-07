using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("Tags");

        builder.HasKey(t => t.Id);

        // 属性配置
        builder.Property(t => t.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.Ordinal)
            .HasDefaultValue(0);

        // 关系配置
        builder.HasOne(t => t.Category)
            .WithMany(c => c.Tags)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        // 索引
        builder.HasIndex(t => t.Type);
        builder.HasIndex(t => t.CategoryId);
        builder.HasIndex(t => new { t.Type, t.Name });
    }
}