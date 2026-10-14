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
    public const string OfflineNotAllowed = "offline_not_allowed";
    public const string RequestExpired = "request_expired";
    public const string RequestUsed = "request_used";
    public const string OfflineDevice = "offline_device";
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

    /// <summary>啟用方式：online／offline。離線裝置要上傳停用憑證才能釋放席次</summary>
    public string Mode { get; set; } = "online";
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

    /// <summary>是否開放離線啟用；關閉時會員中心不顯示離線啟用區塊</summary>
    public bool OfflineEnabled { get; set; }

    /// <summary>離線授權的租約天數</summary>
    public int OfflineLeaseDays { get; set; }

    public List<MemberLicenseDeviceDto> Devices { get; set; } = new();

    /// <summary>只有「剛建立」或「剛重新產生」時才有值：序號明文只顯示這一次</summary>
    public string? NewKey { get; set; }
}

/// <summary>會員在會員中心上傳離線啟用請求（.req 的文字內容）</summary>
public class OfflineActivateRequest
{
    /// <summary>.req 檔案的完整內容（base64url 字串）</summary>
    public string? Request { get; set; }
}

/// <summary>離線啟用／續期的結果：授權檔（.lic）的內容</summary>
public class OfflineLicenseResponse
{
    /// <summary>授權檔字串；會員中心存成 license.lic 讓使用者帶回離線電腦匯入</summary>
    public string License { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public DateTime LeaseUntil { get; set; }

    /// <summary>true＝這台裝置原本就已離線啟用，這次是換發新的授權檔（不佔新席次）</summary>
    public bool Renewed { get; set; }
}

/// <summary>會員在會員中心上傳離線停用憑證（.deact 的文字內容）</summary>
public class OfflineDeactivateRequest
{
    public string? Certificate { get; set; }
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

    /// <summary>是否開放離線啟用（.req／.lic）。關閉後會員中心不再提供離線啟用與續期，已啟用的離線裝置在租約內仍可使用</summary>
    public bool OfflineEnabled { get; set; } = true;

    /// <summary>離線授權的租約天數（離線電腦要在這段時間內帶回平台換發新的離線授權檔）。比線上租約長，因為離線電腦沒有網路可以自動續期</summary>
    public int OfflineLeaseDays { get; set; } = 90;

    public static string? Validate(LicenseSettingsDto s)
    {
        if (s.DefaultSeats is < 1 or > 100) return "預設席次必須在 1 到 100 之間";
        if (s.LeaseDays is < 1 or > 365) return "租約天數必須在 1 到 365 之間";
        if (s.OfflineLeaseDays is < 1 or > 365) return "離線租約天數必須在 1 到 365 之間";
        return null;
    }
}
