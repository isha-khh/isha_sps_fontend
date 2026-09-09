"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 積木元件：「N 秒後自動跳轉」的倒數數字，對應舊站 httpstatus.html
 * （404 頁）的 `<span class="highlight-num">7</span>`。
 *
 * 舊站原始碼裡這顆數字是寫死的靜態文字——`httpstatus.html` 本身兩段
 * `$(document).ready(...)` 都是空的，翻遍 `coreScript.js` 也沒有任何
 * 跟 `highlight-num`／倒數／自動跳轉相關的邏輯，純粹是「畫面上寫著
 * 7 秒後會跳轉，但其實永遠不會跳轉」的半成品。照抄成靜態文字反而
 * 比舊站更糟——使用者會真的等著看它跳轉，結果什麼也沒發生。這裡
 * 補上真的倒數 + 導頁邏輯，把設計稿原本要表達的行為做完整。
 *
 * 只有這顆數字本身需要是 Client Component（`useRouter`／`useState`
 * 用得到瀏覽器端 API），呼叫它的 `not-found.tsx` 本身可以繼續是
 * Server Component（才能保留 `export const metadata`）。
 */
export default function AutoRedirectCountdown({ seconds, href = "/" }: { seconds: number; href?: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push(href);
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router, href]);

  return <span className="highlight-num">{secondsLeft}</span>;
}
