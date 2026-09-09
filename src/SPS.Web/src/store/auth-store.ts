import { create } from "zustand";

/**
 * 最小可用的 auth store，只滿足 `api-client.ts` 401 refresh 失敗時
 * 呼叫 `useAuthStore.getState().clear()` 這個型別需求。
 *
 * `api-client.ts` 那段是照抄 `SPS.AdminWeb` 的管理後台 401 重登入
 * 流程（refresh 失敗 → 清 auth 狀態 → 導去 `/login`），SPS.Web 是
 * 公開網站、目前沒有這種登入態，正常情況下不會真的走到那段
 * catch 分支——這裡先給一個最小的 stub 讓型別過，不是要在這個
 * 專案做一套完整的後台登入狀態管理。真的要做會員登入狀態時，
 * 這支檔案要整個換成對應會員（不是管理員）的 auth store。
 */
interface AuthState {
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  clear: () => set({}),
}));
