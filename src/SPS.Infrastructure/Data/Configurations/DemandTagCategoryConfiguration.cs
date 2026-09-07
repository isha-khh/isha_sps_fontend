using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class DemandTagCategoryConfiguration : IEntityTypeConfiguration<DemandTagCategory>
{
    public void Configure(EntityTypeBuilder<DemandTagCategory> builder)
    {
        builder.ToTable("DemandTagCategories");

        // 複合主鍵
        builder.HasKey(dtc => new { dtc.DemandId, dtc.CategoryId });

        // 關係配置
        builder.HasOne(dtc => dtc.Demand)
            .WithMany()
            .HasForeignKey(dtc => dtc.DemandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(dtc => dtc.Category)
            .WithMany()
            .HasForeignKey(dtc => dtc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引
        builder.HasIndex(dtc => dtc.CategoryId);
    }
}
