import { create } from "zustand";
import type { MemberInfo } from "@/types/auth";

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
 * 這個人，只是這個 store 需要重新知道「現在是誰登入」。之後如果要在
 * 重新整理後還能顯示「已登入」（例如全站 Header 的會員選單），做法是
 * 在最上層（例如 Header 或某個 Providers 元件）掛載時呼叫一次
 * `authApi.getProfile()`、成功的話 `setMember()` 回填——這裡先不做，
 * 目前只有 `/member/login` 這個登入表單會用到這個 store。
 */
interface AuthState {
  member: MemberInfo | null;
  setMember: (member: MemberInfo | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  member: null,
  setMember: (member) => set({ member }),
  clear: () => set({ member: null }),
}));
