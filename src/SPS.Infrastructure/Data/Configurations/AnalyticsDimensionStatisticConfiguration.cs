using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class AnalyticsDimensionStatisticConfiguration : IEntityTypeConfiguration<AnalyticsDimensionStatistic>
{
    public void Configure(EntityTypeBuilder<AnalyticsDimensionStatistic> builder)
    {
        builder.ToTable("AnalyticsDimensionStatistic");

        // 複合索引：同一天、同一種類型、同一種值的數據應該只有一筆
        builder.HasIndex(x => new { x.Date, x.DimensionType, x.DimensionValue }).IsUnique();
        
        builder.Property(x => x.DimensionValue).HasMaxLength(100).IsRequired();
    }
}
