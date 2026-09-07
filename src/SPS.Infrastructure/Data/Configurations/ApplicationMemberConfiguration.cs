using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ApplicationMemberConfiguration : IEntityTypeConfiguration<ApplicationMember>
{
    public void Configure(EntityTypeBuilder<ApplicationMember> builder)
    {
        builder.ToTable("ApplicationMember");
        builder.HasKey(am => am.Id);

        // 必填字段
        builder.Property(am => am.ContactName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(am => am.Position)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(am => am.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(am => am.Phone)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(am => am.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        // 可選字段
        builder.Property(am => am.Extension)
            .HasMaxLength(20);

        builder.Property(am => am.MobilePhone)
            .HasMaxLength(50);

        // 枚舉
        builder.Property(am => am.MemberPosition)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(am => am.Status)
            .HasConversion<int>()
            .IsRequired();

        // 關係：ApplicationMember → MemberApplication
        builder.HasOne(am => am.Application)
            .WithMany(a => a.ApplicationMembers)
            .HasForeignKey(am => am.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 關係：ApplicationMember → Member (CreatedMember)
        builder.HasOne(am => am.CreatedMember)
            .WithMany()
            .HasForeignKey(am => am.CreatedMemberId)
            .OnDelete(DeleteBehavior.SetNull);

        // 索引：提高查詢性能
        builder.HasIndex(am => am.ApplicationId)
            .HasDatabaseName("IX_ApplicationMember_ApplicationId");

        builder.HasIndex(am => am.Email)
            .HasDatabaseName("IX_ApplicationMember_Email");

        builder.HasIndex(am => new { am.ApplicationId, am.OrderIndex })
            .HasDatabaseName("IX_ApplicationMember_ApplicationId_OrderIndex");
    }
}
