import axios from 'axios';

// 判斷是否在伺服器端（SSR）
const isServer = typeof window === 'undefined';

// 統一取得 basePath（客戶端和 SSR 皆可用）
const _bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
const normalizedBasePath = _bp.startsWith('/') ? _bp : (_bp ? `/${_bp}` : '');

/**
 * 為路徑加上 basePath 前綴，用於直接拼接的 URL（圖片 src、下載連結等）
 * 例如 withBasePath('/api/FileManagement/xxx/download') → '/sps/api/FileManagement/xxx/download'
 * 絕對 URL（http/https 開頭）不處理
 */
export function withBasePath(path: string): string {
  if (!path || !normalizedBasePath) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith(normalizedBasePath + '/') || path === normalizedBasePath) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBasePath}${p}`;
}

/**
 * 遞迴處理 API 回傳資料，將 URL 欄位（uri, fileUrl, imageUrl 等）加上 basePath
 */
const URL_FIELD_PATTERN = /(?:^uri$|^photo$|url$|uri$)/i;

function addBasePathToResponseData(data: unknown): unknown {
  if (!normalizedBasePath || data == null) return data;

  if (Array.isArray(data)) {
    return data.map(addBasePathToResponseData);
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (typeof value === 'string' && URL_FIELD_PATTERN.test(key) && value.startsWith('/')) {
        result[key] = withBasePath(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = addBasePathToResponseData(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return data;
}

// SSR 時使用完整 URL（`API_URL`，server-only，正式環境可能是瀏覽器連不到
// 的內部位址，例如 Docker 內部 hostname，只給 Next.js 伺服器自己打後端用）。
//
// 客戶端原本這裡是直接用 `normalizedBasePath`（空字串或站台 basePath），
// 假設正式環境會有一層外部 reverse proxy 把同源的 `/api/*` 轉給後端——
// 但本機開發沒有這層 proxy、`next.config.ts` 也沒有設定對應的
// `rewrites()`，導致瀏覽器端所有 API 呼叫（例如會員登入）都會打到
// Next.js 伺服器自己身上（沒有這個路由，404），不是打到後端。
//
// 優先用 `NEXT_PUBLIC_API_BASE`——跟 `content-list-utils.ts` 的
// `resolveBackendAssetUrl()` 是同一顆環境變數、同一個理由：這是「瀏覽器
// 連得到的後端公開位址」，`.env.local` 本機開發已經有設
// （`http://localhost:5055`）。正式環境如果真的是靠外部 proxy 做成同源，
// 不設這個變數，就會照原本的行為退回 `normalizedBasePath`。
const clientBaseUrl = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, '');
const API_BASE_URL = isServer
  ? (process.env.API_URL || 'http://backend:8080')
  : (clientBaseUrl || normalizedBasePath);

let csrfToken: string | null = null;


/**
 * 核心功能：獲取 CSRF Token 並存入記憶體
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await apiClient.get('/api/antiforgery/token');
    csrfToken = response.data.token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token', error);
  }
};


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },

  withCredentials: true,
});

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  async (config) => {
    // 1. 如果是 GET, HEAD, OPTIONS 等安全方法，通常不需要 CSRF token
    const safeMethods = ['get', 'head', 'options'];
    if (config.method && !safeMethods.includes(config.method.toLowerCase())) {

      // 2. 如果目前沒有 Token，可以嘗試抓取一次 (視需求而定)
      if (!csrfToken) {
        await fetchCsrfToken();
      }

      // 3. 注入後端要求的 Header 名稱: X-CSRF-TOKEN
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Request interceptor (不再需要手動添加 token，cookie 會自動發送)
apiClient.interceptors.request.use(
  (config) => {
    // Token 現在存儲在 httpOnly cookie 中，瀏覽器會自動發送
    // 不需要手動添加 Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 用於追蹤刷新狀態，避免多個請求同時刷新
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor: 自動為回傳資料中的 URL 欄位加上 basePath
apiClient.interceptors.response.use(
  (response) => {
    response.data = addBasePathToResponseData(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 如果不是 401 錯誤，直接返回
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 如果是認證端點的 401 錯誤，直接返回（登入失敗等）
    // if (isAuthEndpoint) {
    //   return Promise.reject(error);
    // }

    // 如果已經重試過，不再重試
    if (originalRequest._retry) {
      return Promise.reject(error);
    }


    // 如果正在刷新 token，將請求加入隊列
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 嘗試刷新 token——這支檔案原本整段是直接照抄 SPS.AdminWeb 的
      // 版本，401 refresh/logout 打的是**管理後台**的
      // `/api/admin/AdminAuth/*`，不是這裡（公開網站，會員登入）真正
      // 在用的 `/api/Auth/*`（見 `lib/api/auth.ts`／後端
      // `AuthController`）。沒改過來的話，會員 Token 過期時只會一直打
      // 錯的端點、收到 404/401，永遠刷新失敗，直接被導去登出流程。
      await apiClient.post('/api/Auth/refresh');

      // 刷新成功，處理隊列中的請求
      processQueue();

      // 重試原始請求
      return apiClient(originalRequest);
    } catch (refreshError) {
      // 刷新失敗，清空隊列並登出
      processQueue(refreshError);

      // 調用登出 API 以清除 cookie
      await apiClient.post('/api/Auth/logout').catch(() => {});

      // [CRITICAL] 清除 Zustand 持久化的 auth 狀態
      try {
        const { useAuthStore } = await import('@/store/auth-store');
        useAuthStore.getState().clear();
      } catch {
        localStorage.removeItem('auth-storage');
      }

      // 重定向到登入頁——公開網站的登入頁是 `/member/login`，不是
      // 管理後台那個不存在於這個網站的 `/login`。
      window.location.href = '/member/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
