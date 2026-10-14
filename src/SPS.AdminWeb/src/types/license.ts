// XR 軟體授權（後台）
export type LicenseStatus = 'active' | 'suspended' | 'revoked' | 'expired';

export interface LicenseListItem {
  id: string;
  keyHint: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  companyName?: string;
  status: LicenseStatus;
  seats: number;
  seatsOverridden: boolean;
  activeDevices: number;
  validUntil?: string;
  lastSeenAt?: string;
  createdTime: string;
}

export interface LicenseDevice {
  id: string;
  deviceName: string;
  status: 'active' | 'deactivated' | 'revoked';
  firstActivatedAt: string;
  lastSeenAt: string;
  leaseUntil?: string;
  deviceHashPreview: string;
  lastIp?: string;
  clientVersion?: string;
  activationMode: string;
}

export interface LicenseDetail extends LicenseListItem {
  seatsOverride?: number;
  defaultSeats: number;
  leaseDaysOverride?: number;
  leaseDays: number;
  notes?: string;
  memberEligible: boolean;
  ineligibleReason?: string;
  devices: LicenseDevice[];
}

export interface LicenseEvent {
  id: number;
  eventType: string;
  actor: string;
  detail?: string;
  ip?: string;
  at: string;
  activationId?: string;
}

export interface LicenseStats {
  total: number;
  active: number;
  suspended: number;
  revoked: number;
  activeDevices: number;
}

export interface LicenseSettings {
  defaultSeats: number;
  leaseDays: number;
}

export interface UpdateLicenseRequest {
  seatsOverride?: number;
  leaseDaysOverride?: number;
  validUntil?: string;
  clearValidUntil?: boolean;
  notes?: string;
}

export type SigningKeyStatus = 'active' | 'standby' | 'retiring' | 'retired';

export interface SigningKey {
  kid: string;
  kmsKeyVersion: string;
  publicKey: string;
  status: SigningKeyStatus;
  notAfter?: string;
  notes?: string;
  createdTime: string;
}

export interface RegisterSigningKeyRequest {
  kid: string;
  kmsKeyVersion: string;
  notes?: string;
  notAfter?: string;
}

export interface UpdateSigningKeyRequest {
  status?: SigningKeyStatus;
  notAfter?: string;
  clearNotAfter?: boolean;
  notes?: string;
}

export const LICENSE_STATUS_LABEL: Record<LicenseStatus, string> = {
  active: '使用中',
  suspended: '已暫停',
  revoked: '已撤銷',
  expired: '已過期',
};

export const LICENSE_STATUS_BADGE: Record<LicenseStatus, string> = {
  active: 'badge-success',
  suspended: 'badge-warning',
  revoked: 'badge-error',
  expired: 'badge-ghost',
};

export const LICENSE_EVENT_LABEL: Record<string, string> = {
  created: '建立授權',
  key_regenerated: '重新產生／作廢序號',
  activated: '裝置啟用',
  refreshed: '裝置續期',
  refresh_denied: '續期被拒',
  activate_denied: '啟用被拒',
  deactivated: '裝置停用',
  suspended: '暫停授權',
  restored: '恢復授權',
  revoked: '撤銷授權',
  extended: '調整期限／租約／備註',
  seats_changed: '調整席次',
  device_revoked: '遠端停用裝置',
  signing_key_registered: '登錄簽章金鑰',
  signing_key_status_changed: '簽章金鑰狀態變更',
  settings_changed: '修改授權設定',
};

export const SIGNING_KEY_STATUS_LABEL: Record<SigningKeyStatus, string> = {
  active: '簽發中',
  standby: '待命',
  retiring: '退役中',
  retired: '已退役',
};
