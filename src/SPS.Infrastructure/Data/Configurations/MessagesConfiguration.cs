using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MessagesConfiguration : IEntityTypeConfiguration<Messages>
{
    public void Configure(EntityTypeBuilder<Messages> builder)
    {
        builder.ToTable("Messages");

        builder.HasOne(m => m.InitiatorMember)
            .WithMany(mb => mb.Messages)
            .HasForeignKey(m => m.InitiatorMemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(m => m.InitiatorUser)
            .WithMany(u => u.Messages)
            .HasForeignKey(m => m.InitiatorUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(m => m.ChatRecord)
            .WithMany(cr => cr.Messages)
            .HasForeignKey(m => m.ChatRecordId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
