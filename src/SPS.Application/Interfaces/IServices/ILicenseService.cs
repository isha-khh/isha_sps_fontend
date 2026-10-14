using SPS.Application.DTOs.License;

namespace SPS.Application.Interfaces.IServices;

public interface ILicenseService
{
    // ---------- 對外 API（廠商軟體）----------
    Task<LicenseResult<LicenseIssueResponse>> ActivateAsync(LicenseActivateRequest request, string? ip, CancellationToken ct = default);
    Task<LicenseResult<LicenseIssueResponse>> RefreshAsync(LicenseRefreshRequest request, string? ip, CancellationToken ct = default);
    Task<LicenseResult<LicenseOkResponse>> DeactivateAsync(LicenseDeactivateRequest request, string? ip, CancellationToken ct = default);
    Task<LicensePublicKeysResponse> GetPublicKeysAsync(CancellationToken ct = default);

    // ---------- 會員中心 ----------
    Task<MemberLicenseDto> GetMyLicenseAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>具資格且還沒有授權時建立並回傳序號明文（只顯示一次）；已有授權就回傳目前狀態</summary>
    Task<LicenseResult<MemberLicenseDto>> CreateMyLicenseAsync(Guid memberId, string? ip, CancellationToken ct = default);

    /// <summary>重新產生序號：舊序號立即失效（已啟用的裝置不受影響，只是舊序號不能再啟用新裝置）</summary>
    Task<LicenseResult<MemberLicenseDto>> RegenerateMyKeyAsync(Guid memberId, string? ip, CancellationToken ct = default);

    /// <summary>離線啟用／離線續期：會員上傳離線電腦產生的 .req，換回離線授權檔（.lic）。同一台裝置重複上傳是換發，不多佔席次</summary>
    Task<LicenseResult<OfflineLicenseResponse>> OfflineActivateAsync(Guid memberId, string? requestText, string? ip, CancellationToken ct = default);

    /// <summary>離線停用：會員上傳離線電腦產生的停用憑證（.deact），釋放該裝置的席次</summary>
    Task<LicenseResult<MemberLicenseDto>> OfflineDeactivateAsync(Guid memberId, string? certificateText, string? ip, CancellationToken ct = default);

    Task<LicenseResult<MemberLicenseDto>> DeactivateMyDeviceAsync(Guid memberId, Guid activationId, string? ip, CancellationToken ct = default);

    // ---------- 後台 ----------
    Task<(List<AdminLicenseListItemDto> Items, int TotalCount)> ListAsync(AdminLicenseQuery query, CancellationToken ct = default);
    Task<AdminLicenseStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<AdminLicenseDetailDto?> GetDetailAsync(Guid licenseId, CancellationToken ct = default);
    Task<(List<AdminLicenseEventDto> Items, int TotalCount)> ListEventsAsync(Guid licenseId, int page, int pageSize, CancellationToken ct = default);
    Task<LicenseResult<AdminLicenseDetailDto>> AdminUpdateAsync(Guid licenseId, AdminUpdateLicenseRequest request, string actor, string? ip, CancellationToken ct = default);
    Task<LicenseResult<AdminLicenseDetailDto>> AdminSetStatusAsync(Guid licenseId, AdminLicenseStatusRequest request, string actor, string? ip, CancellationToken ct = default);
    Task<LicenseResult<AdminLicenseDetailDto>> AdminRevokeDeviceAsync(Guid licenseId, Guid activationId, string actor, string? ip, CancellationToken ct = default);

    /// <summary>作廢目前的序號（不顯示新序號；會員之後要自己在會員中心重新產生）。用在序號外流時</summary>
    Task<LicenseResult<AdminLicenseDetailDto>> AdminInvalidateKeyAsync(Guid licenseId, string actor, string? ip, CancellationToken ct = default);

    Task<List<AdminSigningKeyDto>> ListSigningKeysAsync(CancellationToken ct = default);
    Task<LicenseResult<AdminSigningKeyDto>> RegisterSigningKeyAsync(RegisterSigningKeyRequest request, string actor, string? ip, CancellationToken ct = default);
    Task<LicenseResult<AdminSigningKeyDto>> UpdateSigningKeyAsync(string kid, UpdateSigningKeyRequest request, string actor, string? ip, CancellationToken ct = default);

    Task<LicenseSettingsDto> GetSettingsAsync(CancellationToken ct = default);
    Task<LicenseResult<LicenseSettingsDto>> UpdateSettingsAsync(LicenseSettingsDto settings, string actor, string? ip, CancellationToken ct = default);
}
