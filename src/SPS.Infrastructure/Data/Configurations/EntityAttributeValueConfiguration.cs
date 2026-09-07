using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class EntityAttributeValueConfiguration : IEntityTypeConfiguration<EntityAttributeValue>
{
    public void Configure(EntityTypeBuilder<EntityAttributeValue> builder)
    {
        builder.ToTable("EntityAttributeValues");

        // 复合主键
        builder.HasKey(eav => new { eav.AttributeValueId, eav.EntityType, eav.EntityId });

        // 属性配置
        builder.Property(eav => eav.EntityType)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(eav => eav.EntityId)
            .IsRequired()
            .HasMaxLength(50);

        // 关系配置
        builder.HasOne(eav => eav.AttributeValue)
            .WithMany(av => av.EntityAttributeValues)
            .HasForeignKey(eav => eav.AttributeValueId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引
        builder.HasIndex(eav => new { eav.EntityType, eav.EntityId });
        builder.HasIndex(eav => eav.AttributeValueId);
    }
}