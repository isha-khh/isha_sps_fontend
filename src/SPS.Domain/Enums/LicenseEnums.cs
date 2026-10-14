namespace SPS.Domain.Enums;

/// <summary>授權狀態（對應 docs/xr-license 的狀態機）</summary>
public enum LicenseStatus : short
{
    Active = 1,
    Suspended = 2,
    Revoked = 3,
    Expired = 4
}

/// <summary>裝置啟用狀態</summary>
public enum ActivationStatus : short
{
    Active = 1,
    Deactivated = 2,
    Revoked = 3
}

/// <summary>簽章金鑰狀態：同一時間只有一把 Active 用來簽發新授權；Standby／Retiring 仍會出現在公開公鑰端點（待命的讓廠商提早內嵌、退役中的讓已簽發的授權在 lease 期間仍能驗證）</summary>
public enum SigningKeyStatus : short
{
    Active = 1,
    Retiring = 2,
    Retired = 3,

    /// <summary>待命：已登錄、公鑰已公開（讓廠商提早內嵌），但還不用來簽發新授權；輪替時先登錄新金鑰為待命，再切換成 Active</summary>
    Standby = 4
}

/// <summary>授權系統用到的固定值</summary>
public static class LicenseConstants
{
    /// <summary>XR 訓練軟體的產品代碼</summary>
    public const string ProductXr = "xr";

    /// <summary>啟用方式（第二期加入 offline）</summary>
    public const string ModeOnline = "online";
    public const string ModeOffline = "offline";

    /// <summary>稽核事件類型（LicenseEvent.EventType）</summary>
    public static class Events
    {
        public const string Created = "created";
        public const string KeyRegenerated = "key_regenerated";
        public const string Activated = "activated";
        public const string Refreshed = "refreshed";
        public const string RefreshDenied = "refresh_denied";
        public const string ActivateDenied = "activate_denied";
        public const string Deactivated = "deactivated";
        public const string Suspended = "suspended";
        public const string Restored = "restored";
        public const string Revoked = "revoked";
        public const string Extended = "extended";
        public const string SeatsChanged = "seats_changed";
        public const string DeviceRevoked = "device_revoked";
        public const string KeyRegistered = "signing_key_registered";
        public const string KeyStatusChanged = "signing_key_status_changed";
        public const string SettingsChanged = "settings_changed";
        public const string OfflineActivated = "offline_activated";
        public const string OfflineRenewed = "offline_renewed";
        public const string OfflineDeactivated = "offline_deactivated";
        public const string OfflineDenied = "offline_denied";
    }
}
