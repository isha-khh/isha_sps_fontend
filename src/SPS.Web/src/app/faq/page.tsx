import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import FaqCategoryList from "@/components/faq/FaqCategoryList";
import FaqAccordion from "@/components/faq/FaqAccordion";
import SearchBar from "@/components/ui/SearchBar";
import { fetchFaq } from "@/lib/api.server";
import { FAQ_ITEMS, deriveFaqCategories } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "常見問題",
};

/**
 * 常見問題列表，對應舊站 page/faq/index.html。
 *
 * 跟 news/serve 不一樣的地方：這裡沒有「全部」分類——舊站側欄
 * （side1_faq.html）四個分類彼此互斥，一定會有一個是 active，沒給
 * `?category=` 時預設顯示第一個分類。
 *
 * 分類是「數字 id」不是字串（對接真後端才發現 `Question.categoryId`
 * 是 `Category` 資料表的數字主鍵，不是舊站/假資料原本用的中文分類
 * 名稱），`?category=` 現在帶的是 `categoryId`。分類清單本身也不是
 * 另外拉一支 API，而是從抓回來的 `items` 反推（見
 * `deriveFaqCategories` 的註解），這樣不管題目是真資料還是退回的假
 * 資料，側欄分類永遠跟看得到的題目對得上。
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

  const { items: backendItems } = await fetchFaq();
  // 後端沒資料（或不可用）時退回假資料，見 FAQ_ITEMS 註解
  const items = backendItems.length > 0 ? backendItems : FAQ_ITEMS;
  const categories = deriveFaqCategories(items);

  const requestedId = rawCategory ? Number(rawCategory) : NaN;
  const activeCategory = categories.find((c) => c.id === requestedId) ?? categories[0];
  const activeHref = `/faq?category=${activeCategory?.id ?? ""}`;
  const filteredItems = activeCategory ? items.filter((item) => item.categoryId === activeCategory.id) : items;

  return (
    <>
      <BodyClass className="faq" />
      <InnerPageShell
        title="常見問題"
        breadcrumb={[
          { label: "常見問題", href: "/faq" },
          ...(activeCategory ? [{ label: activeCategory.name }] : []),
        ]}
        sidebar={
          <FaqCategoryList
            activeHref={activeHref}
            items={categories.map((c) => ({ label: c.name, href: `/faq?category=${c.id}` }))}
          />
        }
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

        {filteredItems.length === 0 ? (
          <p>目前這個分類還沒有常見問題。</p>
        ) : (
          <FaqAccordion items={filteredItems.map((item) => ({ question: item.question, answer: item.answer ?? "" }))} />
        )}
      </InnerPageShell>
    </>
  );
}
