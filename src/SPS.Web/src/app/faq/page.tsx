import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import FaqCategoryList from "@/components/faq/FaqCategoryList";
import FaqAccordion from "@/components/faq/FaqAccordion";
import SearchBar from "@/components/ui/SearchBar";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "常見問題",
};

/**
 * 常見問題列表，對應舊站 page/faq/index.html。
 *
 * 跟 news/serve 不一樣的地方：這裡沒有「全部」分類——舊站側欄
 * （side1_faq.html）四個分類彼此互斥，一定會有一個是 active，沒給
 * `?category=` 時預設顯示第一個分類（`平台與服務說明`，也是舊站
 * 範例資料寫死示範內容的那個分類）。
 *
 * `.faq .main .side1`／`.faq .main .content` 在 style.css 裡有這個
 * 頁面專屬的欄寬（20% / 75%），跟 news/serve 用的 67%/28% 不一樣，
 * 靠 `<BodyClass className="faq" />` 掛上 `body.faq` 讓對應的 CSS
 * 選擇器生效，元件這邊不用另外處理欄寬。
 *
 * 搜尋列用現有的 `<SearchBar />`（不給 `years`），對應舊站
 * page/_uc/search4.html 那個「只有關鍵字、沒有年份下拉」的簡化版，
 * 跟 news 用的 search.html（有年份）是同一個元件、不同用法。
 */
export default async function FaqPage({ searchParams }: PageProps<"/faq">) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = typeof rawCategory === "string" ? rawCategory : FAQ_CATEGORIES[0].label;
  const activeHref = `/faq?category=${activeCategory}`;
  const items = FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <>
      <BodyClass className="faq" />
      <InnerPageShell
        title="常見問題"
        breadcrumb={[{ label: "常見問題", href: "/faq" }, { label: activeCategory }]}
        sidebar={<FaqCategoryList activeHref={activeHref} items={FAQ_CATEGORIES} />}
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
            </div>
          </>
        }
      >
        <div className="search2 mb-4">
          <SearchBar />
        </div>

        {items.length === 0 ? <p>目前這個分類還沒有常見問題。</p> : <FaqAccordion items={items} />}
      </InnerPageShell>
    </>
  );
}
