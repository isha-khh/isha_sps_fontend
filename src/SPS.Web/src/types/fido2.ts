/**
 * FIDO2 WebAuthn 類型定義
 */

/** FIDO2 憑證資訊 */
export interface Fido2CredentialInfo {
  id: string;
  deviceName?: string;
  aaGuid?: string;
  createdTime: string;
  lastUsedAt?: string;
}

/** FIDO2 註冊完成請求 */
export interface Fido2RegisterCompleteRequest {
  attestationResponse: unknown;
  deviceName?: string;
}

/** FIDO2 認證開始請求 */
export interface Fido2AuthenticateStartRequest {
  email?: string;
}

/** FIDO2 認證完成請求 */
export interface Fido2AuthenticateCompleteRequest {
  assertionResponse: unknown;
}

/** FIDO2 系統設定資訊 */
export interface Fido2Info {
  serverDomain: string;
  serverName: string;
  origins: string[];
  enableForMember: boolean;
  enableForAdmin: boolean;
}
