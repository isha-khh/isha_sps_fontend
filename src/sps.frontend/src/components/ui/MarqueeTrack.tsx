"use client";

import { useEffect, useRef } from "react";

/**
 * 積木元件：內頁標題背後那條跑馬燈大字（`.marquee-bg` > `.marquee-track`）。
 *
 * 對照舊站 page/news/index.html、page/serve/index.html 裡的 `<script>`：
 * 畫面上原本只有一顆 `<span>`，「鋪滿整排、無縫循環」的效果是 mount 後
 * 用 jQuery 動態做出來的，不是單靠 CSS 動畫：
 *
 *   1. 把同一顆 `<span>` 複製到 track 總寬度 >= 1.5 倍螢幕寬，避免大
 *      螢幕上文字跑完、後面留白
 *   2. 再把「整組」內容完整複製一份接到尾端——這樣配合 CSS 的
 *      `translateX(-50%)` 動畫，移動剛好半個 track 寬度時，畫面內容會
 *      跟一開始完全重疊，才是真正無縫循環，不是跑到一半卡一下再跳回去
 *
 * 這支元件轉 React 時之前只搬了最外層 markup，這段動態複製漏掉了——
 * 所以只有一顆很窄的 `<span>`，40 秒動畫幾乎看不出在動，跟舊站 demo
 * 「不間斷、很快」的感覺對不起來，這裡把邏輯補回來。
 *
 * 用 ref 直接操作 DOM（跟 Carousel 處理 slick clone 節點是同一種考量）：
 * 這些是純裝飾、`aria-hidden` 的文字，不需要響應式資料或事件，用 React
 * state 重新渲染反而沒必要；`hasDuplicated` 這個 ref 用來擋掉開發模式下
 * React Strict Mode 重複呼叫 effect，避免複製兩次。
 */
export default function MarqueeTrack({ text = "SMART SAFETY " }: { text?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hasDuplicated = useRef(false);

  useEffect(() => {
    if (hasDuplicated.current) return;
    hasDuplicated.current = true;

    const track = trackRef.current;
    const firstSpan = track?.querySelector("span");
    if (!track || !firstSpan) return;

    const targetWidth = window.innerWidth * 1.5;

    // 1. 複製到總寬度至少蓋過 1.5 倍螢幕寬
    // guard 只是防呆上限（例如字型還沒載完、寬度量到 0 導致迴圈跑不完），
    // 不是原本邏輯的一部分。
    let guard = 0;
    while (track.getBoundingClientRect().width < targetWidth && guard < 50) {
      track.appendChild(firstSpan.cloneNode(true));
      guard += 1;
    }

    // 2. 把目前這一整組內容完整複製一份接到尾端，搭配 CSS -50% 動畫
    //    達成無縫循環
    track.insertAdjacentHTML("beforeend", track.innerHTML);
  }, []);

  return (
    <div className="marquee-track" ref={trackRef}>
      <span>{text}</span>
    </div>
  );
}
