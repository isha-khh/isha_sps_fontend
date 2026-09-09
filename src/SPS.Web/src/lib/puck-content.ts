/**
 * 把一段 HTML 包成一份最小、合法的 Puck `Data` JSON 字串（存成單一個
 * `ArticleContent` 區塊），對應真正後端 `GET /api/Question`／
 * `GET /api/SuccessCase` 撈回來的 `answer`／`content` 欄位實際長相：
 *
 *   {"root":{"props":{"title":""}},"content":[{"type":"ArticleContent",
 *    "props":{"content":"<p>...</p>","fontSize":"normal","id":"..."}}]}
 *
 * 之前假資料的 `answer`／`bodyHtml` 都是純 HTML 字串，直接塞
 * `dangerouslySetInnerHTML`／純文字顯示；接上真的後端後才發現富內容
 * 欄位其實都是 Puck 區塊 JSON，不是純 HTML——所以假資料也要跟著改成
 * 同樣的格式，前端才能全程都走同一套 `PuckRenderer`（見
 * `components/puck/PuckRenderer.tsx`＋`lib/puck/live-content-config.tsx`
 * 這份對應真正後端的 Puck 設定），不用「假資料一種渲染方式、真資料
 * 另一種」分岔處理。
 *
 * `id` 要求呼叫端自己給、不要在這裡自動產生亂數/遞增計數器——這個
 * 函式是在模組載入當下（資料檔案本身）呼叫，不是在 render 時，亂數/
 * 計數器在 SSR 重新執行模組時可能對不起來，明確傳入固定字串才穩。
 */
export function wrapHtmlAsPuckContent(id: string, html: string, fontSize: "normal" | "large" | "extraLarge" = "normal"): string {
  return JSON.stringify({
    root: { props: { title: "" } },
    content: [{ type: "ArticleContent", props: { id, content: html, fontSize } }],
  });
}
