using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MemberDemandConfiguration : IEntityTypeConfiguration<MemberDemand>
{
    public void Configure(EntityTypeBuilder<MemberDemand> builder)
    {
        builder.ToTable("MemberDemand");

        builder.HasKey(md => new { md.MemberId, md.DemandId });

        builder.HasOne(md => md.Member)
            .WithMany(m => m.MemberDemands)
            .HasForeignKey(md => md.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(md => md.Demand)
            .WithMany(d => d.MemberDemands)
            .HasForeignKey(md => md.DemandId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
