using System.Text.Json.Serialization;

namespace SPS.Application.DTOs.License;

// ======================= 對外 API（廠商軟體呼叫；欄位名稱是對外規格，snake_case）=======================

public class LicenseActivateRequest
{
    [JsonPropertyName("license_key")] public string? LicenseKey { get; set; }
    [JsonPropertyName("device_hash")] public string? DeviceHash { get; set; }
    [JsonPropertyName("device_name")] public string? DeviceName { get; set; }
    [JsonPropertyName("client_version")] public string? ClientVersion { get; set; }
}

public class LicenseRefreshRequest
{
    [JsonPropertyName("license")] public string? License { get; set; }
    [JsonPropertyName("device_hash")] public string? DeviceHash { get; set; }
    [JsonPropertyName("client_version")] public string? ClientVersion { get; set; }
}

public class LicenseDeactivateRequest
{
    [JsonPropertyName("license")] public string? License { get; set; }
    [JsonPropertyName("device_hash")] public string? DeviceHash { get; set; }
}

public class LicenseIssueResponse
{
    [JsonPropertyName("license")] public string License { get; set; } = string.Empty;
    [JsonPropertyName("server_time")] public string ServerTime { get; set; } = string.Empty;
}

public class LicenseOkResponse
{
    [JsonPropertyName("ok")] public bool Ok { get; set; } = true;
}

public class LicensePublicKeyDto
{
    [JsonPropertyName("kid")] public string Kid { get; set; } = string.Empty;
    [JsonPropertyName("alg")] public string Alg { get; set; } = "ES256";
    /// <summary>SubjectPublicKeyInfo（DER）的 base64；.NET 用 <c>ImportSubjectPublicKeyInfo</c> 直接匯入</summary>
    [JsonPropertyName("spki")] public string Spki { get; set; } = string.Empty;
    [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
    [JsonPropertyName("not_after")] public string? NotAfter { get; set; }
}

public class LicensePublicKeysResponse
{
    [JsonPropertyName("keys")] public List<LicensePublicKeyDto> Keys { get; set; } = new();
}

public class LicenseErrorResponse
{
    [JsonPropertyName("error")] public string Error { get; set; } = string.Empty;
    [JsonPropertyName("message")] public string Message { get; set; } = string.Empty;
}

/// <summary>授權 API 的錯誤代碼（對外規格）</summary>
public static class LicenseErrors
{
    public const string InvalidRequest = "invalid_request";
    public const string InvalidKey = "invalid_key";
    public const string InvalidLicense = "invalid_license";
    public const string NotEligible = "not_eligible";
    public const string SeatsExceeded = "seats_exceeded";
    public const string LicenseExpired = "license_expired";
    public const string LicenseSuspended = "license_suspended";
    public const string LicenseRevoked = "license_revoked";
    public const string DeviceNotAllowed = "device_not_allowed";
    public const string RateLimited = "rate_limited";
    public const string ServiceUnavailable = "service_unavailable";
}

/// <summary>Service 層的結果：成功帶資料，失敗帶錯誤代碼、訊息與建議的 HTTP 狀態碼</summary>
public class LicenseResult<T>
{
    public bool Success { get; private init; }
    public T? Data { get; private init; }
    public string ErrorCode { get; private init; } = string.Empty;
    public string Message { get; private init; } = string.Empty;
    public int HttpStatus { get; private init; } = 200;

    public static LicenseResult<T> Ok(T data) => new() { Success = true, Data = data };
    public static LicenseResult<T> Fail(string code, string message, int httpStatus) =>
        new() { Success = false, ErrorCode = code, Message = message, HttpStatus = httpStatus };
}

// ======================= 會員中心（會員自己用）=======================

public class MemberLicenseDeviceDto
{
    public Guid Id { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime FirstActivatedAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public DateTime? LeaseUntil { get; set; }
}

public class MemberLicenseDto
{
    /// <summary>會員是否具備使用資格（企業、需求端或兼營、審核通過、未停用）</summary>
    public bool Eligible { get; set; }

    /// <summary>不具資格的原因（給會員看的文字）；具資格時為 null</summary>
    public string? IneligibleReason { get; set; }

    public bool HasLicense { get; set; }
    public string? Status { get; set; }
    public string? KeyHint { get; set; }
    public int Seats { get; set; }
    public int ActiveDevices { get; set; }
    public DateTime? ValidUntil { get; set; }
    public int LeaseDays { get; set; }
    public List<MemberLicenseDeviceDto> Devices { get; set; } = new();

    /// <summary>只有「剛建立」或「剛重新產生」時才有值：序號明文只顯示這一次</summary>
    public string? NewKey { get; set; }
}

// ======================= 後台 =======================

public class AdminLicenseListItemDto
{
    public Guid Id { get; set; }
    public string KeyHint { get; set; } = string.Empty;
    public Guid MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string MemberEmail { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Seats { get; set; }
    public bool SeatsOverridden { get; set; }
    public int ActiveDevices { get; set; }
    public DateTime? ValidUntil { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class AdminLicenseDeviceDto : MemberLicenseDeviceDto
{
    public string DeviceHashPreview { get; set; } = string.Empty;
    public string? LastIp { get; set; }
    public string? ClientVersion { get; set; }
    public string ActivationMode { get; set; } = string.Empty;
}

public class AdminLicenseEventDto
{
    public long Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string? Ip { get; set; }
    public DateTime At { get; set; }
    public Guid? ActivationId { get; set; }
}

public class AdminLicenseDetailDto : AdminLicenseListItemDto
{
    public int? SeatsOverride { get; set; }
    public int DefaultSeats { get; set; }
    public int? LeaseDaysOverride { get; set; }
    public int LeaseDays { get; set; }
    public string? Notes { get; set; }
    public bool MemberEligible { get; set; }
    public string? IneligibleReason { get; set; }
    public List<AdminLicenseDeviceDto> Devices { get; set; } = new();
}

public class AdminLicenseQuery
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdminLicenseStatsDto
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Suspended { get; set; }
    public int Revoked { get; set; }
    public int ActiveDevices { get; set; }
}

/// <summary>調整授權：每個欄位沒帶（null）就不動；SeatsOverride／LeaseDaysOverride 傳 0 代表清除覆寫（改用預設值）</summary>
public class AdminUpdateLicenseRequest
{
    public int? SeatsOverride { get; set; }
    public int? LeaseDaysOverride { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool ClearValidUntil { get; set; }
    public string? Notes { get; set; }
}

public class AdminLicenseStatusRequest
{
    /// <summary>suspend／restore／revoke</summary>
    public string Action { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

public class AdminSigningKeyDto
{
    public string Kid { get; set; } = string.Empty;
    public string KmsKeyVersion { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? NotAfter { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class RegisterSigningKeyRequest
{
    public string Kid { get; set; } = string.Empty;
    public string KmsKeyVersion { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? NotAfter { get; set; }
}

public class UpdateSigningKeyRequest
{
    /// <summary>active／retiring／retired；設成 active 時，原本的 active 金鑰會自動改為 retiring</summary>
    public string? Status { get; set; }
    public DateTime? NotAfter { get; set; }
    public bool ClearNotAfter { get; set; }
    public string? Notes { get; set; }
}

/// <summary>系統設定「License」（後台可調）</summary>
public class LicenseSettingsDto
{
    /// <summary>預設席次（每份授權可個別覆寫）</summary>
    public int DefaultSeats { get; set; } = 2;

    /// <summary>預設租約天數（客戶端要在這段時間內連線續期）</summary>
    public int LeaseDays { get; set; } = 30;

    public static string? Validate(LicenseSettingsDto s)
    {
        if (s.DefaultSeats is < 1 or > 100) return "預設席次必須在 1 到 100 之間";
        if (s.LeaseDays is < 1 or > 365) return "租約天數必須在 1 到 365 之間";
        return null;
    }
}
