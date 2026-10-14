import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";

/** 我的 XR 授權裡的一台裝置 */
export interface MemberLicenseDevice {
  id: string;
  deviceName: string;
  /** active／deactivated／revoked */
  status: string;
  firstActivatedAt: string;
  lastSeenAt: string;
  leaseUntil?: string | null;
}

export interface MemberLicense {
  /** 是否具備使用資格（企業、需求端或兼營、審核通過） */
  eligible: boolean;
  ineligibleReason?: string | null;
  hasLicense: boolean;
  /** active／suspended／revoked／expired */
  status?: string | null;
  keyHint?: string | null;
  seats: number;
  activeDevices: number;
  validUntil?: string | null;
  leaseDays: number;
  devices: MemberLicenseDevice[];
  /** 只有剛建立或剛重新產生時才有值，序號明文只顯示這一次 */
  newKey?: string | null;
}

/** 這組端點的錯誤是 `{ error: 代碼, message: 說明 }`，要顯示的是 message（共用的 getApiErrorMessage 會先取到代碼） */
export function getLicenseErrorMessage(error: unknown, fallback = "操作失敗，請稍後再試"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error && !/^[a-z_]+$/.test(data.error)) return data.error;
  }
  return fallback;
}

// ========== 會員中心：XR 軟體授權 ==========
export const memberLicenseApi = {
  async get(): Promise<MemberLicense> {
    return (await apiClient.get("/api/member/license")).data;
  },
  /** 取得序號（第一次）；回傳的 newKey 只有這一次看得到 */
  async create(): Promise<MemberLicense> {
    return (await apiClient.post("/api/member/license")).data;
  },
  /** 重新產生序號：舊序號立即失效，已啟用的裝置不受影響 */
  async regenerate(): Promise<MemberLicense> {
    return (await apiClient.post("/api/member/license/regenerate")).data;
  },
  /** 停用自己的某一台裝置，釋出席次 */
  async deactivateDevice(activationId: string): Promise<MemberLicense> {
    return (await apiClient.post(`/api/member/license/devices/${activationId}/deactivate`)).data;
  },
};
