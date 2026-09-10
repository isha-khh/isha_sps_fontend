import { create } from "zustand";
import type { MemberInfo } from "@/types/auth";
import { authApi } from "@/lib/api/auth";

/**
 * 會員（前台）登入狀態，取代原本只滿足型別需求的 stub——見這支檔案的
 * git 歷史那版註解：「真的要做會員登入狀態時，這支檔案要整個換成對應
 * 會員（不是管理員）的 auth store」。
 *
 * 只存 `member`（`MemberInfo`），不存 token：真正的 Token 一律在
 * HttpOnly Cookie 裡（`AuthController` 的 `SetAuthCookiesAsync`），
 * JS 本來就讀不到、也不需要讀到，這裡只是給畫面用的「目前登入的是
 * 誰」顯示狀態。
 *
 * 沒有做 `persist`（localStorage）：這是**記憶體內**狀態，重新整理
 * 網頁就會清空，回到 `member: null`——Cookie 本身還在、後端仍然認得
 * 這個人，只是這個 store 需要重新知道「現在是誰登入」，靠的就是下面
 * `fetchProfile()`：2026-09-10 會員中心（`/member`）掛載時會呼叫一次
 * 這個方法，成功就代表 Cookie 還有效、把 `member` 填回來；401 就代表
 * 沒登入或過期，`member` 維持 `null`，畫面另外導去登入頁——不用整套
 * localStorage 持久化機制，Cookie 本身已經是持久化的來源。
 */
interface AuthState {
  member: MemberInfo | null;
  /** `fetchProfile()` 進行中；畫面用來顯示載入中狀態，避免還沒查完
   * 就先當作「沒登入」而誤導使用者。 */
  loading: boolean;
  setMember: (member: MemberInfo | null) => void;
  /** 呼叫 `GET /api/Auth/profile`（Cookie 認證）確認目前是否登入，
   * 成功就把 `member` 填回來，401/其他錯誤就清空。 */
  fetchProfile: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  member: null,
  loading: false,
  setMember: (member) => set({ member }),
  fetchProfile: async () => {
    set({ loading: true });
    try {
      const member = await authApi.getProfile();
      set({ member, loading: false });
    } catch {
      set({ member: null, loading: false });
    }
  },
  clear: () => set({ member: null }),
}));
