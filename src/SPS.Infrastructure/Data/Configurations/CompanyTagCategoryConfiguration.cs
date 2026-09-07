using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class CompanyTagCategoryConfiguration : IEntityTypeConfiguration<CompanyTagCategory>
{
    public void Configure(EntityTypeBuilder<CompanyTagCategory> builder)
    {
        builder.ToTable("CompanyTagCategories");

        // 複合主鍵
        builder.HasKey(ctc => new { ctc.CompanyId, ctc.CategoryId });

        // 關係配置
        builder.HasOne(ctc => ctc.Company)
            .WithMany()
            .HasForeignKey(ctc => ctc.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ctc => ctc.Category)
            .WithMany()
            .HasForeignKey(ctc => ctc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引
        builder.HasIndex(ctc => ctc.CategoryId);
    }
}
