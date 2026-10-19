import { Fragment } from "react";
import { withBasePath } from "@/lib/api-client";

export interface PageSubNavLink {
  label: string;
  href: string;
}

/** 補助資源：本計畫補助／政府補助資源（設計稿 page/support/index.html、p01.html 的 `.s_meu_lk`） */
export const SUPPORT_SUB_NAV: PageSubNavLink[] = [
  { label: "本計畫補助", href: "/support" },
  { label: "政府補助資源", href: "/support/resources" },
];

/** 人才培育：知識加值／XR（設計稿 page/talent/index.html、xr.html 的 `.s_meu_lk`） */
export const TALENT_SUB_NAV: PageSubNavLink[] = [
  { label: "知識加值", href: "/talent" },
  { label: "XR", href: "/talent/xr" },
];

/**
 * 積木元件：跑馬燈標題旁、同一組兄弟頁面的子選單（設計稿的 `.s_meu_lk`），給 `<InnerPageShell titleAside={...}>` 用。
 * 資料驅動：每組頁面各自給一份連結（見上面的 `SUPPORT_SUB_NAV`／`TALENT_SUB_NAV`），不用為每組頁面各寫一個元件。
 * 推廣專區（`PromotionSubNav`）、媒合對接（`MatchingSubNav`）、服務專區（`ServeSubNav`）是更早做的專用版本，樣式相同。
 */
export default function PageSubNav({ links, activeHref }: { links: PageSubNavLink[]; activeHref: string }) {
  return (
    <div className="s_meu_lk">
      <ul className="nav">
        {links.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && <li className="s_meu_sid"></li>}
            <li>
              <a href={withBasePath(link.href)} title={link.label} className={link.href === activeHref ? "active" : undefined}>
                {link.label}
              </a>
            </li>
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
