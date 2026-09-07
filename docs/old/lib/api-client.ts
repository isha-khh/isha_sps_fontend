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

// SSR 時使用完整 URL（因為 rewrites 只對客戶端有效）
// 客戶端使用 basePath（走 Next.js rewrites）
const API_BASE_URL = isServer
  ? (process.env.API_URL || 'http://backend:8080')
  : normalizedBasePath;

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

    // 排除登入和刷新 API 本身，避免無限循環
    // const isAuthEndpoint = originalRequest.url?.includes('/api/admin/AdminAuth/login') ||
    //                       originalRequest.url?.includes('/api/admin/AdminAuth/refresh') ||
    //                       originalRequest.url?.includes('/api/admin/AdminAuth/logout');

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
      // 嘗試刷新 token
      await apiClient.post('/api/admin/AdminAuth/refresh');

      // 刷新成功，處理隊列中的請求
      processQueue();

      // 重試原始請求
      return apiClient(originalRequest);
    } catch (refreshError) {
      // 刷新失敗，清空隊列並登出
      processQueue(refreshError);

      // 調用登出 API 以清除 cookie
      await apiClient.post('/api/admin/AdminAuth/logout').catch(() => {});

      // [CRITICAL] 清除 Zustand 持久化的 auth 狀態
      try {
        const { useAuthStore } = await import('@/store/auth-store');
        useAuthStore.getState().clear();
      } catch {
        localStorage.removeItem('auth-storage');
      }

      // 重定向到登入頁
      window.location.href = '/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
