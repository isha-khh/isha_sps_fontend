/**
 * 積木元件：分類標籤，對應舊站的 `.badge-tag`。
 *
 * 舊站的靜態 HTML 因為沒有真的資料判斷，同一個位置會放好幾個
 * `.badge-tag`、用 `d-none` 藏掉其他分類（註解寫「程式判斷」）。
 * 這裡用 React 直接讓呼叫端只渲染「當下這一個」分類就好：
 *   <Badge>公告</Badge>
 */
export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge-tag">{children}</span>;
}
