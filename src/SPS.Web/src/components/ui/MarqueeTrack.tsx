"use client";

import { motion } from "motion/react";

/**
 * 一輪要重複幾次文字——這裡沒有實際量測畫面寬度，用固定次數保守抓
 * 到「就算是超寬螢幕/4K 顯示器，這個次數的文字排起來也絕對超過
 * 2 倍畫面寬」這個安全值。抓太少會在超寬螢幕上看到跑馬燈跑到底、
 * 還沒接上下一輪就先看到空白；文字重複只是幾個 `<span>`，抓寬鬆一點
 * 成本很低，故意留餘裕。
 */
const REPEAT_COUNT = 16;

/**
 * 積木元件：內頁標題背後那條跑馬燈大字（`.marquee-bg` > `.marquee-track`）。
 *
 * 2026-09-09 改用 Motion（原 Framer Motion）驅動動畫，取代原本手刻、
 * 掛載後用 jQuery 風格的 `cloneNode` 動態複製 DOM 的版本。原本那版的
 * 複雜度幾乎都來自「怎麼確保有夠多重複文字填滿整排」這件事：
 * 用 `getBoundingClientRect()` 量目前寬度，量不夠就繼續複製，湊到
 * 1.5 倍螢幕寬才停手——量測要等網頁字型（Noto Sans TC，字重 900）真的
 * 載入完成才準，字型還沒套用時量到的是系統預設字型的寬度（通常較窄），
 * 複製份數會算少，因此還要另外等 `document.fonts.ready` 才能量，邏輯
 * 不簡單，也是「第一次進頁面效果跑不對、重新整理才正常」那個 bug的
 * 根源（量測時機卡到字型還沒換上來的空窗期）。
 *
 * 換掉的做法：與其「量出剛好夠用的份數」，直接**固定重複夠多次**
 * （見上面 `REPEAT_COUNT` 的說明），SSR 階段就渲染好，完全不用等
 * 掛載後再量測/複製——不用管字型什麼時候載完，也不會有上述那個
 * bug（問題根源是「量測時機」，這裡直接不量測，問題不會發生），也
 * 沒有 React Strict Mode 重複執行 effect 導致複製兩次的風險（本來就
 * 沒有 effect 在做這件事了）。
 *
 * 動畫改用 Motion 的 `animate`／`transition.repeat: Infinity`，宣告式
 * 寫法，不用 ref 操作 DOM，也不用 `useEffect`。原本掛在 `.marquee-track`
 * 上的 CSS `animation: marqueeScroll 40s linear infinite`
 * （`public/css/style.css`）要蓋掉，見 `globals.css` 裡對應的說明，
 * 不然兩邊會同時想控制同一個 `transform`，畫面會抖動/互相打架。
 *
 * 無縫循環的原理不變：內容重複兩輪（`runA`／`runB`，每輪都已經多到
 * 能蓋滿 2 倍螢幕寬），對整組做 `translateX` 從 0% 到 -50%——因為兩輪
 * 內容一模一樣，移動剛好半個總寬度時，畫面內容會跟一開始完全重疊，
 * 才是真正無縫循環，不是跑到一半卡一下再跳回去。
 */
export default function MarqueeTrack({
  text = "SMART SAFETY ",
  /** 跑完一輪（0% 到 -50%）要花幾秒，數字越小跑越快。舊站 CSS 動畫原本也是 40 秒 */
  durationSeconds = 150,
}: {
  text?: string;
  durationSeconds?: number;
}) {
  const runA = Array.from({ length: REPEAT_COUNT }, (_, i) => <span key={`a-${i}`}>{text}</span>);
  const runB = Array.from({ length: REPEAT_COUNT }, (_, i) => <span key={`b-${i}`}>{text}</span>);

  return (
    <motion.div
      className="marquee-track"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
    >
      {runA}
      {runB}
    </motion.div>
  );
}
