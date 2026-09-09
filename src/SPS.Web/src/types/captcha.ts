/** 驗證碼類型 */
export const CaptchaType = {
  /** 無驗證碼 */
  None: 0,
  /** Cloudflare Turnstile */
  Turnstile: 1,
  /** 圖片驗證碼 */
  ImageCode: 2,
} as const;

export type CaptchaType = typeof CaptchaType[keyof typeof CaptchaType];

/** 驗證碼生成回應 */
export interface CaptchaGenerateResponse {
  /** 驗證碼 ID */
  captchaId: string;
  /** Base64 編碼的圖片 */
  imageBase64: string;
  /** 過期時間（秒） */
  expiresInSeconds: number;
}

/** 驗證碼驗證請求 */
export interface CaptchaVerifyRequest {
  /** 驗證碼類型 */
  type: CaptchaType;
  /** 驗證碼 ID（用於圖片驗證碼） */
  captchaId?: string;
  /** 驗證碼值（用於圖片驗證碼） */
  code?: string;
  /** Turnstile Token（用於 Turnstile 驗證） */
  turnstileToken?: string;
}

/** 登入請求中的驗證碼資料 */
export interface CaptchaData {
  /** 驗證碼類型 */
  type: CaptchaType;
  /** 驗證碼 ID（用於圖片驗證碼） */
  captchaId?: string;
  /** 驗證碼值（用於圖片驗證碼） */
  code?: string;
  /** Turnstile Token（用於 Turnstile 驗證） */
  turnstileToken?: string;
}

/** 公開的 CAPTCHA 設定（前端使用） */
export interface CaptchaPublicSettings {
  /** 是否啟用 */
  enabled: boolean;
  /** 驗證碼類型 */
  captchaType: CaptchaType;
  /** Turnstile 網站金鑰（僅 Turnstile 類型時有值） */
  turnstileSiteKey?: string;
  /** 是否啟用音訊驗證碼 */
  enableAudio: boolean;
}

/** CAPTCHA 系統設定 */
export interface CaptchaSettings {
  /** 是否啟用 CAPTCHA */
  enabled: boolean;
  /** 驗證碼類型：0=None, 1=Turnstile, 2=ImageCode */
  captchaType: CaptchaType;
  /** 適用場景設定 */
  scenarios: CaptchaScenarios;
  /** Turnstile 設定 */
  turnstile: TurnstileSettings;
  /** 圖片驗證碼設定 */
  imageCaptcha: ImageCaptchaSettings;
}

/** CAPTCHA 適用場景 */
export interface CaptchaScenarios {
  /** 會員登入 */
  memberLogin: boolean;
  /** 會員註冊 */
  memberRegister: boolean;
  /** 管理員登入 */
  adminLogin: boolean;
  /** 忘記密碼 */
  forgotPassword: boolean;
}

/** Cloudflare Turnstile 設定 */
export interface TurnstileSettings {
  /** 網站金鑰（前端使用） */
  siteKey: string;
  /** 秘密金鑰（後端驗證用） */
  secretKey: string;
}

/** 圖片驗證碼設定 */
export interface ImageCaptchaSettings {
  /** 驗證碼長度 */
  codeLength: number;
  /** 過期時間（秒） */
  expirationSeconds: number;
  /** 最大嘗試次數 */
  maxAttempts: number;
  /** 是否啟用音訊驗證碼 */
  enableAudio: boolean;
}
