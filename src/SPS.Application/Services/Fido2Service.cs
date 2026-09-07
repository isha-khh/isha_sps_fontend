using System.Text.Json;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Auth;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class Fido2Service : IFido2Service
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFido2Provider _fido2Provider;
    private readonly IDistributedCache _cache;
    private readonly ITokenService _tokenService;
    private readonly ILogger<Fido2Service> _logger;

    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
    };

    public Fido2Service(
        IUnitOfWork unitOfWork,
        IFido2Provider fido2Provider,
        IDistributedCache cache,
        ITokenService tokenService,
        ILogger<Fido2Service> logger)
    {
        _unitOfWork = unitOfWork;
        _fido2Provider = fido2Provider;
        _cache = cache;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<Result<CredentialCreateOptions>> StartRegistrationAsync(
        string ownerType, Guid ownerId, string? deviceName, CancellationToken ct)
    {
        try
        {
            var (userName, userEmail) = await GetOwnerInfoAsync(ownerType, ownerId, ct);
            if (userName == null)
                return Result<CredentialCreateOptions>.Failure("使用者不存在");

            var existingCredentials = await GetExistingCredentialDescriptorsAsync(ownerType, ownerId, ct);

            var fidoUser = new Fido2User
            {
                Id = ownerId.ToByteArray(),
                Name = userEmail ?? userName,
                DisplayName = userName
            };

            var fido2 = await _fido2Provider.GetFido2Async(ct);
            var options = fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                User = fidoUser,
                ExcludeCredentials = existingCredentials,
                AuthenticatorSelection = new AuthenticatorSelection
                {
                    ResidentKey = ResidentKeyRequirement.Preferred,
                    UserVerification = UserVerificationRequirement.Preferred
                },
                AttestationPreference = AttestationConveyancePreference.None
            });

            var sessionKey = $"fido2:{ownerType}:reg:{ownerId}";
            var sessionData = options.ToJson();
            await _cache.SetStringAsync(sessionKey, sessionData, CacheOptions, ct);

            return Result<CredentialCreateOptions>.Success(options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FIDO2 StartRegistration failed for {OwnerType}:{OwnerId}", ownerType, ownerId);
            return Result<CredentialCreateOptions>.Failure("開始註冊失敗");
        }
    }

    public async Task<Result> CompleteRegistrationAsync(
        string ownerType, Guid ownerId, AuthenticatorAttestationRawResponse attestation, string? deviceName, CancellationToken ct)
    {
        try
        {
            var sessionKey = $"fido2:{ownerType}:reg:{ownerId}";
            var sessionData = await _cache.GetStringAsync(sessionKey, ct);
            if (sessionData == null)
                return Result.Failure("註冊 session 已過期，請重新開始");

            var options = CredentialCreateOptions.FromJson(sessionData);

            var fido2 = await _fido2Provider.GetFido2Async(ct);
            var credential = await fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
            {
                AttestationResponse = attestation,
                OriginalOptions = options,
                IsCredentialIdUniqueToUserCallback = async (args, cancellationToken) =>
                {
                    var exists = await _unitOfWork.FidoCredentials.ExistsByCredentialIdAsync(args.CredentialId, cancellationToken);
                    return !exists;
                }
            }, ct);

            var fidoCredential = new FidoCredential
            {
                Id = Guid.NewGuid(),
                CredentialId = credential.Id,
                PublicKey = credential.PublicKey,
                UserHandle = credential.User.Id,
                SignatureCounter = credential.SignCount,
                CredentialType = ownerType,
                MemberId = ownerType == "Member" ? ownerId : null,
                UserId = ownerType == "User" ? ownerId : null,
                DeviceName = deviceName,
                AaGuid = credential.AaGuid,
            };

            await _unitOfWork.FidoCredentials.AddAsync(fidoCredential, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _cache.RemoveAsync(sessionKey, ct);

            return Result.Success();
        }
        catch (Fido2VerificationException ex)
        {
            _logger.LogWarning(ex, "FIDO2 attestation verification failed for {OwnerType}:{OwnerId}", ownerType, ownerId);
            return Result.Failure($"憑證驗證失敗: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FIDO2 CompleteRegistration failed for {OwnerType}:{OwnerId}", ownerType, ownerId);
            return Result.Failure("完成註冊失敗");
        }
    }

    public async Task<Result<AssertionOptions>> StartAuthenticationAsync(
        string ownerType, string? email, CancellationToken ct)
    {
        try
        {
            var allowedCredentials = new List<PublicKeyCredentialDescriptor>();

            if (!string.IsNullOrEmpty(email))
            {
                var (ownerId, credentials) = await ResolveOwnerCredentialsByEmailAsync(ownerType, email, ct);
                if (ownerId == null)
                    return Result<AssertionOptions>.Failure("使用者不存在");

                allowedCredentials = credentials;

                if (allowedCredentials.Count == 0)
                    return Result<AssertionOptions>.Failure("此帳號尚未註冊安全金鑰");
            }

            var fido2 = await _fido2Provider.GetFido2Async(ct);
            var options = fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = allowedCredentials,
                UserVerification = UserVerificationRequirement.Preferred
            });

            var challengeKey = $"fido2:{ownerType}:auth:{Convert.ToBase64String(options.Challenge)}";
            var sessionData = options.ToJson();
            await _cache.SetStringAsync(challengeKey, sessionData, CacheOptions, ct);

            return Result<AssertionOptions>.Success(options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FIDO2 StartAuthentication failed for {OwnerType}", ownerType);
            return Result<AssertionOptions>.Failure("開始認證失敗");
        }
    }

    public async Task<Result<TokenResponse>> CompleteMemberAuthenticationAsync(
        AuthenticatorAssertionRawResponse assertion, CancellationToken ct)
    {
        try
        {
            var fidoCredential = await _unitOfWork.FidoCredentials.GetByCredentialIdAsync(assertion.RawId, ct);
            if (fidoCredential == null || fidoCredential.CredentialType != "Member")
                return Result<TokenResponse>.Failure("憑證不存在");

            var options = await FindAuthSessionAsync("Member", assertion, ct);
            if (options == null)
                return Result<TokenResponse>.Failure("認證 session 已過期，請重新開始");

            var fido2 = await _fido2Provider.GetFido2Async(ct);
            var assertionResult = await fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = assertion,
                OriginalOptions = options,
                StoredPublicKey = fidoCredential.PublicKey,
                StoredSignatureCounter = fidoCredential.SignatureCounter,
                IsUserHandleOwnerOfCredentialIdCallback = async (args, cancellationToken) =>
                {
                    var cred = await _unitOfWork.FidoCredentials.GetByCredentialIdAsync(args.CredentialId, cancellationToken);
                    return cred?.UserHandle?.SequenceEqual(args.UserHandle) ?? false;
                }
            }, ct);

            fidoCredential.SignatureCounter = assertionResult.SignCount;
            fidoCredential.LastUsedAt = DateTime.UtcNow;
            _unitOfWork.FidoCredentials.Update(fidoCredential);

            var member = await _unitOfWork.Members.GetByIdAsync(fidoCredential.MemberId!.Value, ct);
            if (member == null)
                return Result<TokenResponse>.Failure("會員不存在");

            var tokenResponse = _tokenService.GenerateToken(member);

            member.RefreshToken = tokenResponse.RefreshToken;
            member.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
            _unitOfWork.Members.Update(member);

            await _unitOfWork.SaveChangesAsync(ct);

            await RemoveAuthSessionAsync("Member", assertion, ct);

            return Result<TokenResponse>.Success(tokenResponse);
        }
        catch (Fido2VerificationException ex)
        {
            _logger.LogWarning(ex, "FIDO2 assertion verification failed for Member");
            return Result<TokenResponse>.Failure($"認證失敗: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FIDO2 CompleteMemberAuthentication failed");
            return Result<TokenResponse>.Failure("完成認證失敗");
        }
    }

    public async Task<Result<AdminTokenResponse>> CompleteUserAuthenticationAsync(
        AuthenticatorAssertionRawResponse assertion, CancellationToken ct)
    {
        try
        {
            var fidoCredential = await _unitOfWork.FidoCredentials.GetByCredentialIdAsync(assertion.RawId, ct);
            if (fidoCredential == null || fidoCredential.CredentialType != "User")
                return Result<AdminTokenResponse>.Failure("憑證不存在");

            var options = await FindAuthSessionAsync("User", assertion, ct);
            if (options == null)
                return Result<AdminTokenResponse>.Failure("認證 session 已過期，請重新開始");

            var fido2 = await _fido2Provider.GetFido2Async(ct);
            var assertionResult = await fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = assertion,
                OriginalOptions = options,
                StoredPublicKey = fidoCredential.PublicKey,
                StoredSignatureCounter = fidoCredential.SignatureCounter,
                IsUserHandleOwnerOfCredentialIdCallback = async (args, cancellationToken) =>
                {
                    var cred = await _unitOfWork.FidoCredentials.GetByCredentialIdAsync(args.CredentialId, cancellationToken);
                    return cred?.UserHandle?.SequenceEqual(args.UserHandle) ?? false;
                }
            }, ct);

            fidoCredential.SignatureCounter = assertionResult.SignCount;
            fidoCredential.LastUsedAt = DateTime.UtcNow;
            _unitOfWork.FidoCredentials.Update(fidoCredential);

            var user = await _unitOfWork.Users.GetByIdWithRolesAsync(fidoCredential.UserId!.Value, ct);
            if (user == null)
                return Result<AdminTokenResponse>.Failure("管理員不存在");

            var tokenResponse = _tokenService.GenerateAdminToken(user);

            user.Token = tokenResponse.RefreshToken;
            await _unitOfWork.Users.UpdateAsync(user, ct);

            await _unitOfWork.SaveChangesAsync(ct);

            await RemoveAuthSessionAsync("User", assertion, ct);

            return Result<AdminTokenResponse>.Success(tokenResponse);
        }
        catch (Fido2VerificationException ex)
        {
            _logger.LogWarning(ex, "FIDO2 assertion verification failed for User");
            return Result<AdminTokenResponse>.Failure($"認證失敗: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FIDO2 CompleteUserAuthentication failed");
            return Result<AdminTokenResponse>.Failure("完成認證失敗");
        }
    }

    public async Task<Result<List<Fido2CredentialInfo>>> GetCredentialsAsync(
        string ownerType, Guid ownerId, CancellationToken ct)
    {
        var credentials = ownerType == "Member"
            ? await _unitOfWork.FidoCredentials.GetByMemberIdAsync(ownerId, ct)
            : await _unitOfWork.FidoCredentials.GetByUserIdAsync(ownerId, ct);

        var result = credentials.Select(c => new Fido2CredentialInfo
        {
            Id = c.Id,
            DeviceName = c.DeviceName,
            AaGuid = c.AaGuid,
            CreatedTime = c.CreatedTime,
            LastUsedAt = c.LastUsedAt
        }).ToList();

        return Result<List<Fido2CredentialInfo>>.Success(result);
    }

    public async Task<Result> DeleteCredentialAsync(
        Guid credentialEntityId, string ownerType, Guid ownerId, CancellationToken ct)
    {
        var credential = await _unitOfWork.FidoCredentials.GetByIdAsync(credentialEntityId, ct);
        if (credential == null)
            return Result.Failure("憑證不存在");

        if (credential.CredentialType != ownerType)
            return Result.Failure("無權刪除此憑證");

        var isOwner = ownerType == "Member"
            ? credential.MemberId == ownerId
            : credential.UserId == ownerId;

        if (!isOwner)
            return Result.Failure("無權刪除此憑證");

        _unitOfWork.FidoCredentials.Remove(credential);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }

    #region Private Helpers

    private async Task<(string? Name, string? Email)> GetOwnerInfoAsync(string ownerType, Guid ownerId, CancellationToken ct)
    {
        if (ownerType == "Member")
        {
            var member = await _unitOfWork.Members.GetByIdAsync(ownerId, ct);
            return member == null ? (null, null) : (member.Person?.Name ?? member.Email, member.Email);
        }
        else
        {
            var user = await _unitOfWork.Users.GetByIdAsync(ownerId, ct);
            return user == null ? (null, null) : (user.Name, user.Email);
        }
    }

    private async Task<List<PublicKeyCredentialDescriptor>> GetExistingCredentialDescriptorsAsync(
        string ownerType, Guid ownerId, CancellationToken ct)
    {
        var credentials = ownerType == "Member"
            ? await _unitOfWork.FidoCredentials.GetByMemberIdAsync(ownerId, ct)
            : await _unitOfWork.FidoCredentials.GetByUserIdAsync(ownerId, ct);

        return credentials.Select(c => new PublicKeyCredentialDescriptor(c.CredentialId)).ToList();
    }

    private async Task<(Guid? OwnerId, List<PublicKeyCredentialDescriptor> Credentials)> ResolveOwnerCredentialsByEmailAsync(
        string ownerType, string email, CancellationToken ct)
    {
        if (ownerType == "Member")
        {
            var member = await _unitOfWork.Members.GetByEmailAsync(email, ct);
            if (member == null) return (null, new List<PublicKeyCredentialDescriptor>());

            var credentials = await _unitOfWork.FidoCredentials.GetByMemberIdAsync(member.Id, ct);
            return (member.Id, credentials.Select(c => new PublicKeyCredentialDescriptor(c.CredentialId)).ToList());
        }
        else
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(email, ct);
            if (user == null) return (null, new List<PublicKeyCredentialDescriptor>());

            var credentials = await _unitOfWork.FidoCredentials.GetByUserIdAsync(user.Id, ct);
            return (user.Id, credentials.Select(c => new PublicKeyCredentialDescriptor(c.CredentialId)).ToList());
        }
    }

    private async Task<AssertionOptions?> FindAuthSessionAsync(
        string ownerType, AuthenticatorAssertionRawResponse assertion, CancellationToken ct)
    {
        try
        {
            var clientData = JsonSerializer.Deserialize<JsonElement>(assertion.Response.ClientDataJson);
            var challengeB64Url = clientData.GetProperty("challenge").GetString();
            if (challengeB64Url == null) return null;

            var challenge = Convert.FromBase64String(Base64UrlToBase64(challengeB64Url));
            var challengeKey = $"fido2:{ownerType}:auth:{Convert.ToBase64String(challenge)}";
            var sessionData = await _cache.GetStringAsync(challengeKey, ct);
            if (sessionData == null) return null;

            return AssertionOptions.FromJson(sessionData);
        }
        catch
        {
            return null;
        }
    }

    private async Task RemoveAuthSessionAsync(
        string ownerType, AuthenticatorAssertionRawResponse assertion, CancellationToken ct)
    {
        try
        {
            var clientData = JsonSerializer.Deserialize<JsonElement>(assertion.Response.ClientDataJson);
            var challengeB64Url = clientData.GetProperty("challenge").GetString();
            if (challengeB64Url == null) return;

            var challenge = Convert.FromBase64String(Base64UrlToBase64(challengeB64Url));
            var challengeKey = $"fido2:{ownerType}:auth:{Convert.ToBase64String(challenge)}";
            await _cache.RemoveAsync(challengeKey, ct);
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    private static string Base64UrlToBase64(string base64Url)
    {
        var s = base64Url.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return s;
    }

    #endregion
}
