import axios from 'axios';

// 開發環境強制使用空字串（通過 Vite proxy 以解決 Cookie 跨域問題）
// 生產環境使用環境變數
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

let csrfToken: string | null = null;
/**
 * 核心功能：獲取 CSRF Token 並存入記憶體
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await apiClient.get('api/antiforgery/token');
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

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 排除登入和刷新 API 本身，避免無限循環
    const isAuthEndpoint = originalRequest.url?.includes('/api/admin/AdminAuth/login') ||
                          originalRequest.url?.includes('/api/admin/AdminAuth/refresh') ||
                          originalRequest.url?.includes('/api/admin/AdminAuth/logout');

    // 如果不是 401 錯誤，直接返回
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 如果是認證端點的 401 錯誤，直接返回（登入失敗等）
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

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

      // [CRITICAL] 清除 Zustand 持久化的狀態
      // 避免因為 localStorage 仍有 isAuthenticated=true 導致路由守衛又把用戶踢回 Dashboard
      localStorage.removeItem('auth-storage');

      // 重定向到登入頁
      window.location.href = '/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
