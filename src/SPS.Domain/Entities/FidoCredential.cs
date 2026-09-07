using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class FidoCredential : BaseEntity<Guid>
{
    public byte[] CredentialId { get; set; } = null!;
    public byte[] PublicKey { get; set; } = null!;
    public byte[] UserHandle { get; set; } = null!;
    public uint SignatureCounter { get; set; }
    public string CredentialType { get; set; } = null!;
    public Guid? MemberId { get; set; }
    public Guid? UserId { get; set; }
    public string? DeviceName { get; set; }
    public Guid? AaGuid { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public Member? Member { get; set; }
    public User? User { get; set; }
}
