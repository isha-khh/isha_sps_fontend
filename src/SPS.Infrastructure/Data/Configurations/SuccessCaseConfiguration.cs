using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

/// <summary>
/// 產業案例（<see cref="SuccessCase"/>）。其他欄位沿用 EF 慣例對應，這裡只補關聯企業 uuid[] 的預設值。
/// </summary>
public class SuccessCaseConfiguration : IEntityTypeConfiguration<SuccessCase>
{
    public void Configure(EntityTypeBuilder<SuccessCase> builder)
    {
        // 關聯企業：uuid[]，既有案例預設空陣列
        builder.Property(sc => sc.CompanyIds)
            .HasColumnType("uuid[]")
            .HasDefaultValueSql("'{}'::uuid[]");
    }
}
