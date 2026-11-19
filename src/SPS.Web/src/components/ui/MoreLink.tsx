import Link from "next/link";

/**
 * 積木元件：站上到處都有的「查看更多 →」箭頭連結，對應舊站的 `.more_x`。
 *
 * 用法：<MoreLink href="/news" label="查看更多最新消息" />
 * 不給 label 時預設「查看更多」；title 不給的話沿用 label。
 *
 * `hidden`：同一張卡片裡已經有一條同目的地的文字連結（例如標題）時，這顆重複的連結不進 Tab 順序、
 * 不給輔助科技念（無障礙檢測 HM1240402E）；滑鼠照樣能點。
 */
export default function MoreLink({
  href,
  label = "查看更多",
  title,
  hidden = false,
}: {
  href: string;
  label?: string;
  title?: string;
  hidden?: boolean;
}) {
  return (
    <Link href={href} title={hidden ? undefined : (title ?? label)} className="more_x" {...(hidden ? { tabIndex: -1, "aria-hidden": true } : {})}>
      <span>{label}</span>
      <i className="bi bi-arrow-right" aria-hidden="true"></i>
    </Link>
  );
}
