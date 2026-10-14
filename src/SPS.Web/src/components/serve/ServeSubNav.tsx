import Link from "next/link";
import { Fragment } from "react";
import { resolveServeCategoryLink, type IndustryAiLink } from "@/lib/industry-ai-link";

/**
 * 積木元件：服務專區跑馬燈標題旁的子選單，對應舊站 page/serve/index.html
 * 的 `.s_meu_lk`——切的是「同一組底下的兄弟分類」（例如「技術工具」這組
 * 的「產業AI／技術文件」），不是服務專區的四個分組互切，資料來自
 * `getServeSiblingCategories`（見 serve-data.ts 開頭的說明）。
 *
 * 跟 PromotionSubNav 是同一個 `.s_meu_lk` 樣式，但那邊固定三個項目、
 * 這邊項目隨分組不同而變，所以是資料驅動的版本，不合併成同一個元件。
 */
export default function ServeSubNav({ categories, activeCategory, industryAiLink }: { categories: string[]; activeCategory: string; industryAiLink?: IndustryAiLink }) {
  return (
    <div className="s_meu_lk">
      <ul className="nav">
        {categories.map((category, index) => (
          <Fragment key={category}>
            {index > 0 && <li className="s_meu_sid"></li>}
            <li>
              {(() => {
                // 「產業AI」在後台開啟外部連結時連到外部網址，其他分類維持站內
                const target = resolveServeCategoryLink(category, industryAiLink);
                return target.external ? (
                  <a href={target.href} title={category} {...(target.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {category}
                  </a>
                ) : (
                  <Link href={target.href} title={category} className={category === activeCategory ? "active" : undefined}>
                    {category}
                  </Link>
                );
              })()}
            </li>
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
