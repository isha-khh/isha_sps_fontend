using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 軟體授權（目前只有 XR 訓練軟體）。一位具資格的會員一份授權；資格（企業、需求端或兼營、審核通過、未停用）
/// 在每次啟用與續期時由 <c>ILicenseService</c> 重新檢查，不另外維護名單。
/// 序號只在產生當下顯示一次，資料庫只存雜湊（<see cref="LicenseKeyHash"/>）與遮罩版本（<see cref="LicenseKeyHint"/>）。
/// </summary>
public class License : BaseEntity<Guid>
{
    /// <summary>產品代碼，見 <see cref="LicenseConstants.ProductXr"/></summary>
    public string ProductCode { get; set; } = LicenseConstants.ProductXr;

    /// <summary>序號的 SHA-256（十六進位小寫）；啟用時用輸入的序號算雜湊比對</summary>
    public string LicenseKeyHash { get; set; } = string.Empty;

    /// <summary>序號的遮罩顯示（例如 XR-****-****-****-AB12），給會員中心與後台辨識用，不是機密</summary>
    public string LicenseKeyHint { get; set; } = string.Empty;

    public Guid MemberId { get; set; }

    /// <summary>簽發當下會員所屬的公司（資料快照，方便後台依公司查詢；資格判斷以會員目前狀態為準）</summary>
    public Guid? CompanyId { get; set; }

    /// <summary>此份授權的席次覆寫；null＝使用系統設定的「預設席次」。後台可隨時調整，調降不會踢掉已啟用的裝置，只是不能再啟用新裝置</summary>
    public int? SeatsOverride { get; set; }

    public LicenseStatus Status { get; set; } = LicenseStatus.Active;

    /// <summary>授權期限（客戶有沒有權利使用）；會員資格有效期間每次續期會往後滾動，後台也可以手動延期／縮短</summary>
    public DateTime? ValidUntil { get; set; }

    /// <summary>此份授權的租約天數覆寫；null＝使用系統設定的預設值</summary>
    public int? LeaseDaysOverride { get; set; }

    /// <summary>暫停／撤銷的原因與備註（後台填寫）</summary>
    public string? Notes { get; set; }

    // Navigation
    public Member? Member { get; set; }
    public ICollection<LicenseActivation> Activations { get; set; } = new List<LicenseActivation>();
}

/// <summary>授權在某一台裝置上的啟用。<c>(LicenseId, DeviceHash)</c> 唯一</summary>
public class LicenseActivation : BaseEntity<Guid>
{
    public Guid LicenseId { get; set; }

    /// <summary>廠商軟體計算的裝置指紋（穩定字串，通常是多個硬體因子的雜湊）</summary>
    public string DeviceHash { get; set; } = string.Empty;

    public string DeviceName { get; set; } = string.Empty;

    /// <summary>第二期（裝置綁定金鑰）用：裝置公鑰（SPKI base64）</summary>
    public string? DevicePublicKey { get; set; }

    public ActivationStatus Status { get; set; } = ActivationStatus.Active;

    public string ActivationMode { get; set; } = LicenseConstants.ModeOnline;

    public DateTime FirstActivatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public string? LastIp { get; set; }
    public string? ClientVersion { get; set; }

    /// <summary>目前這份授權檔的租約到期時間（續期時更新），後台可看哪些裝置快過期</summary>
    public DateTime? LeaseUntil { get; set; }

    public License? License { get; set; }
}

/// <summary>授權稽核事件：只新增、不修改、不刪除。<c>Detail</c> 放 JSON（不含序號明文與個資）</summary>
public class LicenseEvent : BaseEntity<long>
{
    public Guid? LicenseId { get; set; }
    public Guid? ActivationId { get; set; }

    /// <summary>見 <see cref="LicenseConstants.Events"/></summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>member:{id}／admin:{id}／device／system</summary>
    public string Actor { get; set; } = "system";

    public string? Detail { get; set; }
    public string? Ip { get; set; }
}

/// <summary>
/// 簽章金鑰登錄（Cloud KMS）。<b>只存公鑰與 KMS 金鑰版本的資源名稱</b>，私鑰永遠在 KMS 裡。
/// <see cref="Kid"/> 會寫進每份授權檔，客戶端依 kid 選公鑰。
/// </summary>
public class LicenseSigningKey
{
    /// <summary>金鑰編號（例如 prod-2026-10、test-2026-10）；主鍵</summary>
    public string Kid { get; set; } = string.Empty;

    /// <summary>KMS 金鑰版本資源名稱（projects/…/cryptoKeyVersions/N）</summary>
    public string KmsKeyVersion { get; set; } = string.Empty;

    /// <summary>公鑰（SubjectPublicKeyInfo，base64），登錄時由 KMS 取回</summary>
    public string PublicKey { get; set; } = string.Empty;

    public SigningKeyStatus Status { get; set; } = SigningKeyStatus.Active;

    /// <summary>公鑰附的有效期限：超過後客戶端不再信任（退役金鑰用）</summary>
    public DateTime? NotAfter { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedTime { get; set; } = DateTime.UtcNow;
}
