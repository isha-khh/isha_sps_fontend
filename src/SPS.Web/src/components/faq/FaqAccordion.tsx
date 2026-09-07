"use client";

import { useState } from "react";

export interface FaqAccordionItemData {
  question: string;
  answer: string;
}

/**
 * 積木元件：常見問題手風琴，對應舊站 page/faq/index.html 的 `.faq_box`
 * （`.accordion-item`／`.accordion-header`／`.collapse-body`）。
 *
 * 舊站是用 jQuery 的 `slideUp`／`slideDown` 做展開動畫，`.collapse-body`
 * 這個 class 本身在 CSS 裡完全沒有定義任何高度或 transition 規則——
 * 純粹是靠 jQuery 動畫直接改 DOM 高度撐出來的效果，沒有 CSS 動畫可以
 * 照抄。這裡先用 React state 切換 `display`，功能正確（點了會展開/
 * 收合，`aria-expanded` 正確反映實際狀態），滑順的展開動畫之後有需要
 * 再另外補 CSS transition，不是這次遷移的重點。
 *
 * 順便修正舊站原始碼一個小失誤：範例 3 個項目的 `aria-expanded` 全部
 * 寫死 `"true"`，即使第 2、3 項其實用 inline style 蓋成隱藏——這裡讓
 * `aria-expanded` 老實反映「這個項目現在到底是不是展開」，不是照抄
 * 那組對不起來的狀態。
 */
export default function FaqAccordion({ items, defaultOpenIndex = 0 }: { items: FaqAccordionItemData[]; defaultOpenIndex?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="faq_box">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-collapse-${index}`;

        return (
          <div className="accordion-item" key={item.question}>
            <button
              type="button"
              className="accordion-header btn-collapse"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="qa_left">
                <div className="num">{`Q${index + 1}`}</div>
                <span className="title-text">{item.question}</span>
              </div>
              <i className="bi bi-chevron-down toggle-icon" aria-hidden="true"></i>
            </button>

            <div id={panelId} className={`collapse-body${isOpen ? " show" : ""}`} style={isOpen ? undefined : { display: "none" }}>
              <div className="qa_right">
                <div className="txt editor">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
