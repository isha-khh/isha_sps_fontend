using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class DemandMatchResultConfiguration : IEntityTypeConfiguration<DemandMatchResult>
{
    public void Configure(EntityTypeBuilder<DemandMatchResult> builder)
    {
        builder.ToTable("DemandMatchResult");

        // 同一筆需求同一家企業只能有一筆：企業名錄的「成功對接次數」靠它保證不重複計算
        builder.HasIndex(x => new { x.DemandId, x.CompanyId }).IsUnique();
        // 依企業統計成功對接次數（企業名錄排序）
        builder.HasIndex(x => x.CompanyId);

        builder.HasOne(x => x.Demand)
            .WithMany()
            .HasForeignKey(x => x.DemandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
