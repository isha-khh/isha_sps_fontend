"use client";

import { useEffect } from "react";

/**
 * 舊站的 CSS 有極少數規則是掛在 `body.xxx`（例如 `body.home .main .content`），
 * 對應到舊版每個頁面樣板 <body class="xxx"> 各自不同的 class。
 *
 * App Router 的 <body> 只在 app/layout.tsx 定義一次、給所有頁面共用，
 * 沒辦法照舊站那樣每個頁面直接寫死不同的 body class，所以用這個小元件
 * 讓各自的 page.tsx 掛上/卸下自己需要的 class。
 */
export default function BodyClass({ className }: { className: string }) {
  useEffect(() => {
    const classes = className.split(" ").filter(Boolean);
    document.body.classList.add(...classes);
    return () => {
      document.body.classList.remove(...classes);
    };
  }, [className]);

  return null;
}
