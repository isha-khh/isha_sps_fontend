/**
 * HTTP 安全性設定類型定義
 */

/**
 * Cookie 安全設定
 */
export interface CookieSecuritySettings {
  /** 是否啟用 HttpOnly (防止 JS 存取) */
  httpOnly: boolean;
  /** 是否啟用 Secure (僅 HTTPS 傳輸) */
  secure: boolean;
  /** SameSite 設定 */
  sameSite: 'Strict' | 'Lax' | 'None';
  /** AccessToken 效期 (分鐘) */
  accessTokenExpiryMinutes: number;
  /** RefreshToken 效期 (天) */
  refreshTokenExpiryDays: number;
}

/**
 * Security Headers 設定
 */
export interface SecurityHeadersSettings {
  /** 啟用 X-CSRF-TOKEN 驗證 */
  enableCsrfToken: boolean;
  /** 啟用 X-XSS-Protection */
  enableXssProtection: boolean;
  /** 啟用 HSTS */
  enableHsts: boolean;
  /** HSTS max-age (秒) */
  hstsMaxAge: number;
  /** HSTS 是否包含子網域 */
  hstsIncludeSubDomains: boolean;
  /** 啟用 X-Content-Type-Options: nosniff */
  enableContentTypeNosniff: boolean;
  /** 啟用 X-Frame-Options */
  enableFrameOptions: boolean;
  /** X-Frame-Options 值 */
  frameOptionsPolicy: 'DENY' | 'SAMEORIGIN';
  /** 啟用 Referrer-Policy */
  enableReferrerPolicy: boolean;
  /** Referrer-Policy 值 */
  referrerPolicy: string;
  /** 啟用 Permissions-Policy */
  enablePermissionsPolicy: boolean;
  /** Permissions-Policy 值 */
  permissionsPolicy: string;
  /** 啟用 Cross-Origin-Embedder-Policy */
  enableCoep: boolean;
  /** COEP 值 */
  coepPolicy: string;
  /** 啟用 Cross-Origin-Opener-Policy */
  enableCoop: boolean;
  /** COOP 值 */
  coopPolicy: string;
  /** 啟用 Cross-Origin-Resource-Policy */
  enableCorp: boolean;
  /** CORP 值 */
  corpPolicy: string;
}

/**
 * CSP 設定
 */
export interface CspSettings {
  /** 是否啟用 CSP */
  enabled: boolean;
  /** 是否為 Report-Only 模式 */
  reportOnly: boolean;
  /** default-src */
  defaultSrc: string;
  /** script-src */
  scriptSrc: string;
  /** script-src-elem (控制 <script> 元素) */
  scriptSrcElem?: string;
  /** script-src-attr (控制 inline 事件處理器如 onclick="") */
  scriptSrcAttr?: string;
  /** style-src */
  styleSrc: string;
  /** style-src-elem (控制 <style> 元素和 <link rel="stylesheet">) */
  styleSrcElem?: string;
  /** style-src-attr (控制 inline style="" 屬性) */
  styleSrcAttr?: string;
  /** img-src */
  imgSrc: string;
  /** font-src */
  fontSrc: string;
  /** media-src (控制 <audio> 和 <video>) */
  mediaSrc?: string;
  /** connect-src */
  connectSrc: string;
  /** worker-src (控制 Web Worker / Service Worker) */
  workerSrc?: string;
  /** frame-src */
  frameSrc: string;
  /** frame-ancestors */
  frameAncestors: string;
  /** object-src */
  objectSrc: string;
  /** base-uri */
  baseUri: string;
  /** form-action */
  formAction: string;
  /** 自動將 HTTP 升級為 HTTPS */
  upgradeInsecureRequests: boolean;
  /** 違規報告 URI */
  reportUri?: string;
}

/**
 * CORS 設定
 */
export interface CorsSettings {
  /** 是否信任 Proxy Headers */
  trustProxyHeaders: boolean;
  /** 允許的來源清單 */
  allowedOrigins: string[];
  /** 是否允許憑證 */
  allowCredentials: boolean;
  /** 允許的 Methods */
  allowedMethods: string[];
  /** 允許的 Headers */
  allowedHeaders: string[];
}

/**
 * HTTP 安全性設定 - 完整
 */
export interface HttpSecuritySettings {
  /** 使用的模板 */
  activeTemplate: 'strict' | 'standard' | 'relaxed' | 'custom';
  /** Cookie 設定 */
  cookie: CookieSecuritySettings;
  /** Headers 設定 */
  headers: SecurityHeadersSettings;
  /** CSP 設定 */
  csp: CspSettings;
  /** CORS 設定 */
  cors: CorsSettings;
}

/**
 * Nginx 設定匯出結果
 */
export interface NginxConfigExport {
  /** 設定檔內容 */
  configContent: string;
  /** 檔案名稱 */
  fileName: string;
  /** 產生時間 */
  generatedAt: string;
}

/**
 * 安全性模板名稱
 */
export type SecurityTemplateName = 'strict' | 'standard' | 'relaxed';

/**
 * 模板資訊
 */
export interface SecurityTemplateInfo {
  name: SecurityTemplateName;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
}

/**
 * 預設模板資訊
 */
export const securityTemplates: SecurityTemplateInfo[] = [
  {
    name: 'strict',
    label: '嚴格模式',
    description: '最高安全性，適合金融/醫療系統，可能影響部分功能',
    icon: 'lucide--shield-check',
    badgeColor: 'badge-error',
  },
  {
    name: 'standard',
    label: '標準模式',
    description: '平衡安全性與相容性，推薦大多數場景使用',
    icon: 'lucide--shield',
    badgeColor: 'badge-primary',
  },
  {
    name: 'relaxed',
    label: '寬鬆模式',
    description: '較低安全限制，僅適合開發測試環境',
    icon: 'lucide--shield-off',
    badgeColor: 'badge-warning',
  },
];

/**
 * 預設 Cookie 設定
 */
export const defaultCookieSettings: CookieSecuritySettings = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  accessTokenExpiryMinutes: 30,
  refreshTokenExpiryDays: 7,
};

/**
 * 預設 Headers 設定
 */
export const defaultHeadersSettings: SecurityHeadersSettings = {
  enableCsrfToken: true,
  enableXssProtection: true,
  enableHsts: true,
  hstsMaxAge: 31536000,
  hstsIncludeSubDomains: true,
  enableContentTypeNosniff: true,
  enableFrameOptions: true,
  frameOptionsPolicy: 'SAMEORIGIN',
  enableReferrerPolicy: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  enablePermissionsPolicy: true,
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  enableCoep: true,
  coepPolicy: 'require-corp',
  enableCoop: true,
  coopPolicy: 'same-origin',
  enableCorp: true,
  corpPolicy: 'same-origin',
};

/**
 * 預設 CSP 設定
 */
export const defaultCspSettings: CspSettings = {
  enabled: true,
  reportOnly: false,
  defaultSrc: "'self'",
  scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval'",
  styleSrc: "'self' 'unsafe-inline'",
  imgSrc: "'self' data: https:",
  fontSrc: "'self' data:",
  connectSrc: "'self' https: wss:",
  frameSrc: "'self'",
  frameAncestors: "'self'",
  objectSrc: "'none'",
  baseUri: "'self'",
  formAction: "'self'",
  upgradeInsecureRequests: false,
};

/**
 * 預設 CORS 設定
 */
export const defaultCorsSettings: CorsSettings = {
  trustProxyHeaders: true,
  allowedOrigins: [],
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-TOKEN'],
};

/**
 * 預設 HTTP 安全性設定
 */
export const defaultHttpSecuritySettings: HttpSecuritySettings = {
  activeTemplate: 'standard',
  cookie: defaultCookieSettings,
  headers: defaultHeadersSettings,
  csp: defaultCspSettings,
  cors: defaultCorsSettings,
};
