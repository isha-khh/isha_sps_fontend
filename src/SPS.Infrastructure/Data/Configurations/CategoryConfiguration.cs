using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);

        // 属性配置
        builder.Property(c => c.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(c => c.DataMode)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(c => c.Name)
            .HasMaxLength(200);

        builder.Property(c => c.Published)
            .HasDefaultValue(false);

        builder.Property(c => c.Ordinal)
            .HasDefaultValue(0);

        builder.Property(c => c.HasChild)
            .HasDefaultValue(false);

        // 自引用关系（父子分类）
        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // 图片关系
        builder.HasOne(c => c.Picture)
            .WithMany()
            .HasForeignKey(c => c.PictureId)
            .OnDelete(DeleteBehavior.SetNull);

        // 多语言名称关系
        builder.HasOne(c => c.MultilingualName)
            .WithMany()
            .HasForeignKey(c => c.NameId)
            .OnDelete(DeleteBehavior.SetNull);

        // 多语言图片关系
        builder.HasOne(c => c.MultilingualPicture)
            .WithMany()
            .HasForeignKey(c => c.MultilingualPictureId)
            .OnDelete(DeleteBehavior.SetNull);

        // 索引
        builder.HasIndex(c => c.Type);
        builder.HasIndex(c => c.ParentId);
        builder.HasIndex(c => new { c.Type, c.Published });
    }
}