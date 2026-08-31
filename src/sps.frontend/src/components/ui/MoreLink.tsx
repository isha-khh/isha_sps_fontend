/**
 * 積木元件：站上到處都有的「查看更多 →」箭頭連結，對應舊站的 `.more_x`。
 *
 * 用法：<MoreLink href="/news" label="查看更多最新消息" />
 * 不給 label 時預設「查看更多」；title 不給的話沿用 label。
 */
export default function MoreLink({
  href,
  label = "查看更多",
  title,
}: {
  href: string;
  label?: string;
  title?: string;
}) {
  return (
    <a href={href} title={title ?? label} className="more_x">
      <span>{label}</span>
      <i className="bi bi-arrow-right" aria-hidden="true"></i>
    </a>
  );
}
