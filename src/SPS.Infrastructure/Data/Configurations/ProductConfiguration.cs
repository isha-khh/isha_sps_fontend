using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Product");

        // 封面圖片關係
        builder.HasOne(p => p.Cover)
            .WithMany()
            .HasForeignKey(p => p.CoverId)
            .OnDelete(DeleteBehavior.NoAction);

        // 產品圖片關係 (一對多)
        builder.HasMany(p => p.Pictures)
            .WithOne(pic => pic.Product)
            .HasForeignKey(pic => pic.ProductId)
            .OnDelete(DeleteBehavior.NoAction);

        // 產品文件關係 (一對多)
        builder.HasMany(p => p.Files)
            .WithOne(f => f.Product)
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
