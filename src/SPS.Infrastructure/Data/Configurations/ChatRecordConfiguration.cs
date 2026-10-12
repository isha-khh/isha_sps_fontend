using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ChatRecordConfiguration : IEntityTypeConfiguration<ChatRecord>
{
    public void Configure(EntityTypeBuilder<ChatRecord> builder)
    {
        builder.ToTable("ChatRecord");

        // 會員之間的對話用需求回應 Id 找到（每則回應最多一個對話）
        builder.HasIndex(cr => cr.DemandReplyId);

        builder.HasOne(cr => cr.InitiatorCompany)
            .WithMany(c => c.InitiatedChats)
            .HasForeignKey(cr => cr.InitiatorCompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.TargetCompany)
            .WithMany(c => c.ReceivedChats)
            .HasForeignKey(cr => cr.TargetCompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.InitiatorMember)
            .WithMany(m => m.InitiatedChats)
            .HasForeignKey(cr => cr.InitiatorMemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.TargetMember)
            .WithMany(m => m.ReceivedChats)
            .HasForeignKey(cr => cr.TargetMemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.InitiatorUser)
            .WithMany(u => u.InitiatedChats)
            .HasForeignKey(cr => cr.InitiatorUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.TargetUser)
            .WithMany(u => u.ReceivedChats)
            .HasForeignKey(cr => cr.TargetUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
