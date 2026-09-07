using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MemberApplicationConfiguration : IEntityTypeConfiguration<MemberApplication>
{
    public void Configure(EntityTypeBuilder<MemberApplication> builder)
    {
        builder.ToTable("MemberApplication");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ApplicationNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(a => a.ApplicationNumber)
            .IsUnique();

        builder.Property(a => a.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(a => a.Email);

        builder.Property(a => a.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(a => a.ContactName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Phone)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.Extension)
            .HasMaxLength(20);

        builder.Property(a => a.MobilePhone)
            .HasMaxLength(50);

        builder.Property(a => a.Position)
            .HasMaxLength(100);

        builder.Property(a => a.UnifiedSocialCreditCode)
            .HasMaxLength(18)
            .IsRequired();

        builder.HasIndex(a => a.UnifiedSocialCreditCode);

        builder.Property(a => a.CompanyName)
            .HasMaxLength(200);

        builder.Property(a => a.ContactPerson)
            .HasMaxLength(100);

        builder.Property(a => a.BusinessScope)
            .HasMaxLength(1000);

        builder.Property(a => a.CompanyAddress)
            .HasMaxLength(500);

        builder.Property(a => a.Reason)
            .HasMaxLength(1000);

        builder.Property(a => a.Remark)
            .HasMaxLength(1000);

        builder.Property(a => a.ReviewComment)
            .HasMaxLength(1000);

        builder.Property(a => a.RejectionReason)
            .HasMaxLength(1000);

        // Relationships
        builder.HasOne(a => a.Reviewer)
            .WithMany()
            .HasForeignKey(a => a.ReviewerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(a => a.Company)
            .WithMany(c => c.Applications)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(a => a.Documents)
            .WithOne(d => d.Application)
            .HasForeignKey(d => d.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(a => a.Logs)
            .WithOne(l => l.Application)
            .HasForeignKey(l => l.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
