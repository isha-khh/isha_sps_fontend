"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/lib/api-client";

const VISITOR_KEY = "sps-visited";

/**
 * 積木元件：累計網站瀏覽（不渲染任何畫面），掛在根 layout，每次換頁送一次
 * `POST /api/site-counter/visit`，頁尾「瀏覽」數字就是靠它累計的。
 *
 * 頁尾的數字以前是寫死的 `10,781`，後端的計數 API 一直都在、前台從來沒呼叫過。
 *
 * - 「新訪客」：這個瀏覽器第一次來（localStorage 沒有 `sps-visited`）才帶 `isNewVisitor=true`，
 *   頁尾顯示的是累計的新訪客數。localStorage 讀寫失敗（隱私模式）就當作回訪，寧可少算不要重複算。
 *   這個旗標可以被偽造，所以後端另外有「同 IP 24 小時只認一次新訪客」「每分鐘最多 60 次」的防灌水。
 * - 用 `fetch(..., { keepalive: true })`、不走 axios：匿名計數 API，不需要 CSRF token，
 *   也不能因為換頁就被中止。失敗就吞掉，不影響瀏覽。
 * - 開發模式下 React Strict Mode 會讓 effect 跑兩次，用 `sessionStorage` 記住「這個分頁這個路徑
 *   剛送過」（3 秒內）避免同一次載入重複計；使用者重新整理超過 3 秒也算新的一次，這是預期的。
 */
export default function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let isNewVisitor = false;
    try {
      if (!localStorage.getItem(VISITOR_KEY)) {
        isNewVisitor = true;
        localStorage.setItem(VISITOR_KEY, "1");
      }
    } catch {
      // 讀寫失敗當作回訪
    }

    try {
      // 同一個分頁、同一個路徑 3 秒內只算一次：開發模式下 React Strict Mode 會把 effect 連跑兩次，
      // 用「時間差」比對而不是固定時間桶，避免兩次剛好跨過桶的邊界就重複計
      const last = JSON.parse(sessionStorage.getItem("sps-last-counted") ?? "null") as { path: string; at: number } | null;
      const now = Date.now();
      if (last && last.path === pathname && now - last.at < 3000) return;
      sessionStorage.setItem("sps-last-counted", JSON.stringify({ path: pathname, at: now }));
    } catch {
      // 忽略
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");
    const path = `/api/site-counter/visit?isNewVisitor=${isNewVisitor}`;
    fetch(apiBase ? `${apiBase}${path}` : withBasePath(path), {
      method: "POST",
      keepalive: true,
      credentials: "include",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
