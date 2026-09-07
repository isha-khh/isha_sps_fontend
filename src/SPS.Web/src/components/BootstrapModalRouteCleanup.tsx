"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 修 Bootstrap modal ＋ Next.js client-side 導航互相打架的 bug：
 *
 * Bootstrap 的 modal.js 開啟 modal 時，會直接用原生 DOM 操作在
 * `<body>` 外面「加掛」一個 `.modal-backdrop` 元素，並且在 `<body>`
 * 上加 `modal-open` class ＋ inline `overflow`/`padding-right`——這些
 * 都不是 React 畫出來的節點/屬性，React 完全不知道它們存在。正常情況
 * 下這些東西是 Bootstrap 自己的 `hide()` 流程負責清掉（點 X、點
 * backdrop、或呼叫 `.hide()` 都會觸發）。
 *
 * 但如果 modal 裡面放的是 `<Link>`（例如會員註冊完成 modal 的
 * 「前往會員專區」），點下去是 Next.js App Router 的 client-side
 * 導航——只會把 modal 所在的那段 React 樹換掉，不會經過 Bootstrap
 * 的 `hide()`，所以那個直接掛在 `<body>` 上的 `.modal-backdrop`／
 * `modal-open` class 完全沒人清，導致換頁後新頁面被半透明遮罩擋住、
 * 點不到任何東西（使用者回報的「送出完成後前往會員專區被
 * modal-backdrop 擋到」就是這個）。
 *
 * 這裡用 `usePathname()` 偵測到路由真的換了之後，強制把這些遺留
 * 的東西清掉——不管 modal 是不是正常關閉的，換頁就清，一次修掉全站
 * 所有「modal 裡面放內部連結」的組合，不用每個 modal 各自處理。
 * 掛在 layout.tsx 裡，全站只需要一份。
 */
export default function BootstrapModalRouteCleanup() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }, [pathname]);

  return null;
}
