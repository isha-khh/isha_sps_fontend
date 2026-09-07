using Fido2NetLib;
using SPS.Application.Common;
using SPS.Application.DTOs.Auth;

namespace SPS.Application.Interfaces.IServices;

public interface IFido2Service
{
    Task<Result<CredentialCreateOptions>> StartRegistrationAsync(
        string ownerType, Guid ownerId, string? deviceName, CancellationToken ct);

    Task<Result> CompleteRegistrationAsync(
        string ownerType, Guid ownerId, AuthenticatorAttestationRawResponse attestation, string? deviceName, CancellationToken ct);

    Task<Result<AssertionOptions>> StartAuthenticationAsync(
        string ownerType, string? email, CancellationToken ct);

    Task<Result<TokenResponse>> CompleteMemberAuthenticationAsync(
        AuthenticatorAssertionRawResponse assertion, CancellationToken ct);

    Task<Result<AdminTokenResponse>> CompleteUserAuthenticationAsync(
        AuthenticatorAssertionRawResponse assertion, CancellationToken ct);

    Task<Result<List<Fido2CredentialInfo>>> GetCredentialsAsync(
        string ownerType, Guid ownerId, CancellationToken ct);

    Task<Result> DeleteCredentialAsync(
        Guid credentialEntityId, string ownerType, Guid ownerId, CancellationToken ct);
}
