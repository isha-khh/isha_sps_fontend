using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class AnalyticsDailyMetricConfiguration : IEntityTypeConfiguration<AnalyticsDailyMetric>
{
    public void Configure(EntityTypeBuilder<AnalyticsDailyMetric> builder)
    {
        builder.ToTable("AnalyticsDailyMetric");

        // 確保日期是唯一的，因為我們一天只存一筆匯總
        builder.HasIndex(x => x.Date).IsUnique();
        
        builder.Property(x => x.Date)
            .IsRequired();
    }
}
