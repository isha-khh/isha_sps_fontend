import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";

export const metadata: Metadata = {
  title: "找不到頁面",
};

/**
 * 全站 404 頁，對應 App Router 的 `not-found.tsx` 慣例：路由對不到任何
 * 頁面時會自動顯示這支，`notFound()`（news/serve 詳情頁查無資料時呼叫
 * 的那個）也是導到這裡。
 *
 * 舊站沒有交付對應的切版，這是照網站既有的視覺語言（InnerPageShell
 * 版型、`.h2` 的藍色漸層字、`.btn_a` 按鈕、詳情頁常見的裝飾圖）新畫
 * 的一頁，不是遷移。
 */
export default function NotFound() {
  return (
    <>
      <BodyClass className="error-404" />
      <InnerPageShell
        title="找不到頁面"
        breadcrumb={[{ label: "找不到頁面" }]}
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
            </div>
          </>
        }
      >
        {/*
          `.content` 是 InnerPageShell 那個 `.row.gx-0.gy-4` 三欄版型裡的
          中間欄，本來是給列表/文章這種「從上排到下」的內容用的，單純
          text-center 只會讓文字置中、整塊內容還是貼齊欄位上緣。這裡直接
          用 flex 把這塊獨立置中（水平+垂直），不去動 InnerPageShell 的
          版型結構——它對其他頁面都是對的，問題只在這個「畫面中間只有
          一則訊息」的特殊頁面。
        */}
        <div
          className="column_box text-center"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}
        >
          <h2 className="h2" style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}>
            404
          </h2>

          <p className="desc mb-4">您要找的頁面不存在，可能是網址打錯了，或這個頁面已經被移除。</p>

          <Link href="/" className="btn_a d-inline-flex align-items-center justify-content-center" title="回首頁">
            回首頁
          </Link>
        </div>
      </InnerPageShell>
    </>
  );
}
