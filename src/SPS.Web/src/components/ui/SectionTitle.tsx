import type { ReactNode } from "react";

/**
 * 積木元件：每個內容區塊開頭的「英文小標 + 大標題」，對應舊站的
 * `.sub_tag` + `h2.h2`，例如首頁 home_about 的：
 *   <SectionTitle eyebrow="Platform">
 *     智慧工安技術<span>產業資訊暨媒合平台</span>
 *   </SectionTitle>
 *
 * 有些區塊（例如服務專區）標題下面還有一段說明文字，用 `description`
 * 帶進來就好，不用另外寫 <p>。
 *
 * 這裡回傳 Fragment、不多包一層容器 div：舊站的 sub_tag/h2/p 在 DOM
 * 上是彼此的兄弟節點，外層容器（要用 flex 排版還是怎樣）交給呼叫端決定。
 */
export default function SectionTitle({
  eyebrow,
  description,
  children,
}: {
  eyebrow: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="sub_tag">{eyebrow}</div>
      <h2 className="h2">{children}</h2>
      {description && <p>{description}</p>}
    </>
  );
}
