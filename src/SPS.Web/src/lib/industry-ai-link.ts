/**
 * 「產業AI」外部連結開關（後台「內容管理 → 頁面設定 → 產業AI外部連結」）。
 * 關閉（預設）＝「產業AI」維持原本連到網站內的 `/serve?category=產業AI`；開啟＝所有「產業AI」連結改連後台填的外部網址。
 * 這個檔案不能 import 任何 server-only 的東西（Headers 等 client 元件也要用）。
 */
export type IndustryAiLink = {
    enabled: boolean;
    url: string;
    newTab: boolean;
};

export const DISABLED_INDUSTRY_AI_LINK: IndustryAiLink = { enabled: false, url: "", newTab: true };

/** 服務專區（技術工具）裡要換成外部連結的分類名稱 */
export const INDUSTRY_AI_CATEGORY = "產業AI";

/** 分類連結的結果：站內連結（`href` 是站內路徑，要用 Link／withBasePath）或外部連結（`external`，完整網址） */
export type CategoryLinkTarget = { href: string; external: boolean; newTab: boolean };

/** 技術工具分類的連結：「產業AI」在開關開啟時是外部連結，其他分類（或關閉時）是站內的 `/serve?category=<名稱>` */
export function resolveServeCategoryLink(category: string, link?: IndustryAiLink | null): CategoryLinkTarget {
    if (category === INDUSTRY_AI_CATEGORY && link?.enabled && link.url) {
        return { href: link.url, external: true, newTab: link.newTab };
    }
    return { href: `/serve?category=${encodeURIComponent(category)}`, external: false, newTab: false };
}
