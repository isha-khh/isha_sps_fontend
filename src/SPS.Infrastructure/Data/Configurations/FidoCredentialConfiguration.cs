using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class FidoCredentialConfiguration : IEntityTypeConfiguration<FidoCredential>
{
    public void Configure(EntityTypeBuilder<FidoCredential> builder)
    {
        builder.ToTable("FidoCredentials");

        builder.Property(f => f.CredentialId)
            .IsRequired();

        builder.HasIndex(f => f.CredentialId)
            .IsUnique();

        builder.Property(f => f.PublicKey)
            .IsRequired();

        builder.Property(f => f.UserHandle)
            .IsRequired();

        builder.Property(f => f.CredentialType)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(f => f.DeviceName)
            .HasMaxLength(200);

        builder.HasOne(f => f.Member)
            .WithMany()
            .HasForeignKey(f => f.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => new { f.CredentialType, f.MemberId });
        builder.HasIndex(f => new { f.CredentialType, f.UserId });
    }
}
