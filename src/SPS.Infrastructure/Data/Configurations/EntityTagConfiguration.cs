using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class EntityTagConfiguration : IEntityTypeConfiguration<EntityTag>
{
    public void Configure(EntityTypeBuilder<EntityTag> builder)
    {
        builder.ToTable("EntityTags");

        // 复合主键
        builder.HasKey(et => new { et.TagId, et.EntityType, et.EntityId });

        // 属性配置
        builder.Property(et => et.EntityType)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(et => et.EntityId)
            .IsRequired()
            .HasMaxLength(50);

        // 关系配置
        builder.HasOne(et => et.Tag)
            .WithMany(t => t.EntityTags)
            .HasForeignKey(et => et.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引
        builder.HasIndex(et => new { et.EntityType, et.EntityId });
        builder.HasIndex(et => et.TagId);
    }
}