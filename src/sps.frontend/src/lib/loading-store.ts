"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";

/**
 * 首頁載入畫面用的「就緒任務登記表」。
 *
 * 客戶的要求是：Loading 畫面不要用固定秒數，而是等「首頁主要 DOM、
 * Hero 圖片、必要 API 資料」都載入完成才收起來（另外加一個 300～500ms
 * 的最短顯示時間，避免閃一下就消失）。
 *
 * 這幾個條件分別長在完全不同、彼此不知道對方存在的元件裡
 * （PageLoader 自己、Banner 裡的 Hero 圖片、以後可能會有的資料請求
 * 元件），用 zustand 存一份「誰登記了、誰完成了」的表，比較合理：
 * - 這些元件互相沒有父子關係，用 React state/props 會需要拉一個共用
 *   的 Context 包住整棵樹，反而更肥
 * - 只是「登記/查詢就緒狀態」這種簡單全域狀態，不需要 Context 那種
 *   跟著 Provider 生命週期走的機制
 * - PageLoader 用完（首頁載入完成）這份狀態就沒有用了，也不需要
 *   持久化，zustand 預設的記憶體 store 就夠
 *
 * 用法：
 *   在任何要讓 PageLoader 等待的元件裡：
 *     const markReady = useLoadingTask("heroImage");
 *     // ...等真的準備好了再呼叫
 *     markReady();
 *
 *   之後如果首頁哪個區塊改成打真的 API，一樣在那個元件裡：
 *     const markReady = useLoadingTask("apiData:news");
 *     useEffect(() => { fetchNews().then(() => { ...; markReady(); }); }, []);
 */
interface LoadingGateState {
  tasks: Record<string, boolean>;
  register: (key: string) => void;
  complete: (key: string) => void;
}

export const useLoadingGateStore = create<LoadingGateState>((set) => ({
  tasks: {},
  register: (key) => set((state) => (key in state.tasks ? state : { tasks: { ...state.tasks, [key]: false } })),
  complete: (key) => set((state) => (state.tasks[key] ? state : { tasks: { ...state.tasks, [key]: true } })),
}));

/**
 * 元件掛載時登記一項任務，回傳一個「標記完成」的函式。
 * 同一個 key 登記多次沒關係（例如 Fast Refresh 造成重複 mount），
 * 已經登記過的不會被重設回「未完成」。
 */
export function useLoadingTask(key: string): () => void {
  const register = useLoadingGateStore((state) => state.register);
  const complete = useLoadingGateStore((state) => state.complete);

  useEffect(() => {
    register(key);
  }, [key, register]);

  return useCallback(() => complete(key), [key, complete]);
}

/**
 * 是否「所有登記過的任務」都完成了。一項都還沒登記時視為「還沒準備
 * 好」（不是「沒有任務所以直接算完成」）——PageLoader 自己一定會先
 * 登記一個 `dom` 任務墊底，所以正常情況下不會卡在「永遠零任務」的
 * 狀態。
 */
export function useAllLoadingTasksReady(): boolean {
  return useLoadingGateStore((state) => {
    const values = Object.values(state.tasks);
    return values.length > 0 && values.every(Boolean);
  });
}
