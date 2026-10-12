using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MemberBlockConfiguration : IEntityTypeConfiguration<MemberBlock>
{
    public void Configure(EntityTypeBuilder<MemberBlock> builder)
    {
        builder.HasKey(b => new { b.BlockerMemberId, b.BlockedMemberId });
        builder.HasIndex(b => b.BlockedMemberId);
    }
}
