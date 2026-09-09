import { Fragment } from "react";

const LINKS = [
  { label: "企業名錄", href: "/matching/enterprise" },
  // 「媒合對接」設計稿只給了連結位置（`page/matching/index.html`），
  // 頁面本身還沒出現，先照設計稿原樣連過去，之後那頁蓋出來就會生效，
  // 現在點了會是 404——跟 HomeEnterprise 卡片連去這裡的道理一樣，先把
  // 連結格式定下來。
  { label: "媒合對接", href: "/matching" },
];

/**
 * 積木元件：企業名錄／媒合對接共用的跑馬燈標題旁子選單，對應設計稿
 * `page/matching/enterprise.html` 的 `.s_meu_lk`。跟 PromotionSubNav
 * 是同一個樣式、固定項目數，所以照抄同一種寫法。
 */
export default function MatchingSubNav({ activeHref }: { activeHref: string }) {
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
