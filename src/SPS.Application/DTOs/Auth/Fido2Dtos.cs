using Fido2NetLib;

namespace SPS.Application.DTOs.Auth;

public class Fido2RegisterCompleteRequest
{
    public AuthenticatorAttestationRawResponse AttestationResponse { get; set; } = null!;
    public string? DeviceName { get; set; }
}

public class Fido2AuthenticateStartRequest
{
    public string? Email { get; set; }
}

public class Fido2AuthenticateCompleteRequest
{
    public AuthenticatorAssertionRawResponse AssertionResponse { get; set; } = null!;
}

public class Fido2CredentialInfo
{
    public Guid Id { get; set; }
    public string? DeviceName { get; set; }
    public Guid? AaGuid { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? LastUsedAt { get; set; }
}
