import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminAuthApi } from "@/lib/api/admin-auth.ts";
import type { TestResponse } from "@/lib/api/admin-auth.ts";
import { toRequestOptions, fromAssertionResponse } from '@/lib/webauthn';
import type { AdminUserInfo, AdminRegisterRequest, SystemInitResponse, UpdateProfileRequest } from "@/types/admin-auth";
import type { CaptchaData } from "@/types/captcha";

interface AuthState {
  user: AdminUserInfo | null;

  isAuthenticated: boolean;
  checkInit: () => Promise<SystemInitResponse>;
  registerFirstAdmin: (data: AdminRegisterRequest) => Promise<AdminUserInfo>;
  login: (email: string, password: string, captcha?: CaptchaData) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<AdminUserInfo>;
  refreshAccessToken: () => Promise<void>;
  getTest: () => Promise<TestResponse>;
  updateAvatar: (fileId: string | null) => Promise<AdminUserInfo>;
  updateProfile: (request: UpdateProfileRequest) => Promise<AdminUserInfo>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      checkInit: async () => {
        try {
          return await adminAuthApi.checkInit();
        } catch (error) {
          console.error('Check init failed:', error);
          throw error;
        }
      },

      registerFirstAdmin: async (data: AdminRegisterRequest) => {
        try {
          const user = await adminAuthApi.registerFirstAdmin(data);

          // 註冊成功後，給瀏覽器一點時間處理 Cookie
          await new Promise(resolve => setTimeout(resolve, 100));

          // 設置已認證狀態
          set({
            user: user,
            isAuthenticated: true
          });

          return user;
        } catch (error) {
          console.error('Register first admin failed:', error);
          throw error;
        }
      },

      login: async (email, password, captcha) => {
        try {
          // 1. 呼叫登入 API (瀏覽器會嘗試寫入 HttpOnly Cookie)
          await adminAuthApi.login({ email, password, captcha });

          // 2. 給瀏覽器一點時間處理 Cookie (避免 Race Condition)
          await new Promise(resolve => setTimeout(resolve, 100));

          // 3. 關鍵步驟：登入後立即 "試讀" 個人資料
          // 只有當這個請求成功（代表 Cookie 真的帶上了），才將前端狀態設為 "已登入"
          const user = await get().getProfile();

          set({
            user: user,
            isAuthenticated: true
          });

        } catch (error) {
          console.error('Login flow failed (Cookies might be missing):', error);
          // 確保狀態是登出
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      loginWithPasskey: async () => {
        try {
          // 1. 開始認證（不帶 email，觸發 discoverable credentials）
          const serverOptions = await adminAuthApi.fido2AuthenticateStart();

          // 2. 轉換 base64url → ArrayBuffer，呼叫瀏覽器 WebAuthn API
          const credential = await navigator.credentials.get({
            publicKey: toRequestOptions(serverOptions),
          }) as PublicKeyCredential;

          // 3. 轉換 ArrayBuffer → base64url，送回後端驗證
          await adminAuthApi.fido2AuthenticateComplete({
            assertionResponse: fromAssertionResponse(credential),
          });

          // 4. 取得 profile
          await new Promise(resolve => setTimeout(resolve, 100));
          const user = await get().getProfile();
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Passkey login failed:', error);
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // 調用後端 API 清除 httpOnly cookie
          await adminAuthApi.logout();
        } catch (error) {
          console.error('Logout API failed:', error);
        } finally {
          // 無論 API 成功或失敗，都清除前端狀態
          set({ user: null, isAuthenticated: false });
        }
      },

      getProfile: async () => {
        try {
          const user = await adminAuthApi.getProfile();
          set({ user, isAuthenticated: true });
          return user;
        } catch (error) {
          console.error('Get profile failed:', error);
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      refreshAccessToken: async () => {
        try {
          // API 會從 cookie 讀取 refreshToken 並設置新的 cookie
          const adminUser = await adminAuthApi.refreshToken();

          set({
            user: adminUser,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Token refresh failed:', error);
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      getTest: async () => {
        try {
          return await adminAuthApi.test();
        } catch (error) {
          console.error('Get test failed:', error);
          throw error;
        }
      },

      updateAvatar: async (fileId: string | null) => {
        try {
          const user = await adminAuthApi.updateAvatar({ fileId });
          set({ user });
          return user;
        } catch (error) {
          console.error('Update avatar failed:', error);
          throw error;
        }
      },

      updateProfile: async (request: UpdateProfileRequest) => {
        try {
          const user = await adminAuthApi.updateProfile(request);
          set({ user });
          return user;
        } catch (error) {
          console.error('Update profile failed:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      // 只持久化使用者資訊，不包含 token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
