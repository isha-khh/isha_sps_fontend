using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class LicenseConfiguration : IEntityTypeConfiguration<License>
{
    public void Configure(EntityTypeBuilder<License> builder)
    {
        builder.ToTable("Licenses");
        builder.Property(l => l.ProductCode).HasMaxLength(30).IsRequired();
        builder.Property(l => l.LicenseKeyHash).HasMaxLength(64).IsRequired();
        builder.Property(l => l.LicenseKeyHint).HasMaxLength(40).IsRequired();
        builder.Property(l => l.Notes).HasMaxLength(1000);

        // 序號雜湊唯一（啟用時用它找授權）；一位會員同一產品只有一份授權
        builder.HasIndex(l => l.LicenseKeyHash).IsUnique();
        builder.HasIndex(l => new { l.MemberId, l.ProductCode }).IsUnique();
        builder.HasIndex(l => l.CompanyId);
        builder.HasIndex(l => l.Status);

        // 會員被刪除時不連帶刪授權與稽核紀錄（稽核要保留）；會員實際上是停用不是刪除
        builder.HasOne(l => l.Member).WithMany().HasForeignKey(l => l.MemberId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class LicenseActivationConfiguration : IEntityTypeConfiguration<LicenseActivation>
{
    public void Configure(EntityTypeBuilder<LicenseActivation> builder)
    {
        builder.ToTable("LicenseActivations");
        builder.Property(a => a.DeviceHash).HasMaxLength(200).IsRequired();
        builder.Property(a => a.DeviceName).HasMaxLength(200).IsRequired();
        builder.Property(a => a.DevicePublicKey).HasMaxLength(1000);
        builder.Property(a => a.ActivationMode).HasMaxLength(20).IsRequired();
        builder.Property(a => a.LastIp).HasMaxLength(64);
        builder.Property(a => a.ClientVersion).HasMaxLength(50);

        builder.HasIndex(a => new { a.LicenseId, a.DeviceHash }).IsUnique();
        builder.HasOne(a => a.License).WithMany(l => l.Activations).HasForeignKey(a => a.LicenseId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class LicenseEventConfiguration : IEntityTypeConfiguration<LicenseEvent>
{
    public void Configure(EntityTypeBuilder<LicenseEvent> builder)
    {
        builder.ToTable("LicenseEvents");
        builder.Property(e => e.EventType).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Actor).HasMaxLength(80).IsRequired();
        builder.Property(e => e.Ip).HasMaxLength(64);
        builder.Property(e => e.Detail).HasColumnType("jsonb");

        builder.HasIndex(e => new { e.LicenseId, e.CreatedTime });
        builder.HasIndex(e => e.CreatedTime);
    }
}

public class LicenseSigningKeyConfiguration : IEntityTypeConfiguration<LicenseSigningKey>
{
    public void Configure(EntityTypeBuilder<LicenseSigningKey> builder)
    {
        builder.ToTable("LicenseSigningKeys");
        builder.HasKey(k => k.Kid);
        builder.Property(k => k.Kid).HasMaxLength(60);
        builder.Property(k => k.KmsKeyVersion).HasMaxLength(500).IsRequired();
        builder.Property(k => k.PublicKey).HasMaxLength(500).IsRequired();
        builder.Property(k => k.Notes).HasMaxLength(500);
        builder.HasIndex(k => k.Status);
    }
}
