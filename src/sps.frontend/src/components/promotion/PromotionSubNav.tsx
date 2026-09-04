import { Fragment } from "react";

const LINKS = [
  { label: "產業案例", href: "/promotion" },
  { label: "影音專區", href: "/promotion/video" },
  { label: "我要投稿", href: "/promotion/contribute" },
];

/**
 * 積木元件：推廣專區三個子頁面（產業案例／影音專區／我要投稿）共用的
 * 跑馬燈標題旁子選單，對應舊站每個 promotion 頁面都有的 `.s_meu_lk`。
 * 當 `<InnerPageShell titleAside={...}>` 用。
 */
export default function PromotionSubNav({ activeHref }: { activeHref: string }) {
  return (
    <div className="s_meu_lk">
      <ul className="nav">
        {LINKS.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && <li className="s_meu_sid"></li>}
            <li>
              <a href={link.href} title={link.label} className={link.href === activeHref ? "active" : undefined}>
                {link.label}
              </a>
            </li>
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
