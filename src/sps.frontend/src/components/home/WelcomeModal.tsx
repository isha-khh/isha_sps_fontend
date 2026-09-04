"use client";

import { useEffect, useRef, useState } from "react";
import Lightbox from "@/components/ui/Lightbox";

/** localStorage 的 key，記錄「今天不再顯示」勾選當下的日期 */
const STORAGE_KEY = "sps-welcome-modal-dismissed-date";

/** 用使用者本機時間認定的「今天」當比較基準（不是 UTC），符合使用者直覺 */
function todayKey(): string {
  return new Date().toDateString();
}

/**
 * 過渡期元件：原本是 index.html 裡的 #welcome-modal + 進站彈跳公告。
 * 實際的 fancybox 呼叫邏輯在通用積木 [ui/Lightbox.tsx](../ui/Lightbox.tsx)，
 * 這裡只放「首頁要彈什麼內容」。
 *
 * 這版加了「今天不再顯示」勾選：
 * - 用 localStorage 而不是 sessionStorage——這裡要的是「今天」這個
 *   日曆日，跨分頁、瀏覽器關掉重開都要記得，sessionStorage 分頁一關
 *   就重置，不符合需求；換一天之後 localStorage 存的日期對不上，就會
 *   照常再彈出來
 * - 勾起來之後，不管使用者是點 X、點背景、還是按 ESC 關掉對話框，
 *   Fancybox 的 `on.close` 事件都會觸發（見下面 options.on.close），
 *   不用另外攔每一種關閉方式
 * - 勾選狀態放在 ref（`dontShowTodayRef`）不是 React state：Lightbox
 *   的 `autoOpen` effect 只在「掛載當下 autoOpen 變成 true」那次 render
 *   幫 `options` 拍一次快照去呼叫 `Fancybox.show()`（Lightbox.tsx 裡特意
 *   關掉 `exhaustive-deps` 那行是這個意思），之後 checkbox 再怎麼勾都不
 *   會讓 Lightbox 重新呼叫一次 show 去帶新的 `options`——如果拿一般
 *   state 塞進 closure，讀到的永遠是快照當下那個舊值（stale closure）。
 *   ref 是同一顆物件、`.current` 隨時能讀到最新值，才能在真正關閉的那
 *   一刻讀到使用者最後勾的狀態
 * - 「要不要自動彈出」一樣先 `useState(false)`、掛載後的 effect 裡才去
 *   查 localStorage 決定要不要改成 `true`——跟 PageLoader.tsx 那次讀
 *   sessionStorage 是同一個理由：伺服器端沒有 localStorage 可讀，第一次
 *   render 只能先假設「不要自動彈」，避免 hydration 對不起來，事後在
 *   effect 裡才「補開」
 */
export default function WelcomeModal() {
  const [autoOpen, setAutoOpen] = useState(false);
  const dontShowTodayRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) !== todayKey()) {
          setAutoOpen(true);
        }
      } catch {
        // 無痕模式或瀏覽器擋掉 localStorage 時，當作沒關過，照常彈出。
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Lightbox
      id="welcome-modal"
      autoOpen={autoOpen}
      options={{
        autoFocus: true,
        trapFocus: true,
        dragToClose: false,
        backdropClick: true,
        on: {
          close: () => {
            if (!dontShowTodayRef.current) return;
            try {
              localStorage.setItem(STORAGE_KEY, todayKey());
            } catch {
              // 存不進去就算了，頂多使用者下次還是會再看到一次公告。
            }
          },
        },
      }}
    >
      <div style={{ width: "100%", position: "relative" }}>
        <img
          className="img-fluid d-block"
          src="/images/home/ser_bg.jpg"
          alt="活動公告"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />

        <div
          className="checkbox"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
            padding: "0.75em 1em",
            background: "rgba(0, 0, 0, 0.55)",
          }}
        >
          <input
            type="checkbox"
            id="welcome-modal-dont-show-today"
            onChange={(event) => {
              dontShowTodayRef.current = event.target.checked;
            }}
          />
          <label htmlFor="welcome-modal-dont-show-today" style={{ margin: 0, color: "#fff" }}>
            今天不再顯示
          </label>
        </div>
      </div>
    </Lightbox>
  );
}
