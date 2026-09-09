"use client";

import { useState } from "react";
import type { TechAttributeGroup } from "@/lib/matching-data";

/**
 * 積木元件：「智慧技術」三層分類選單（大類 tab → 子分類手風琴 →
 * 可勾選/可瀏覽的項目），對照設計稿的 `.sm_techn`：
 * - 詳情頁（`page/matching/show.html`）：項目是 `<a>` 標籤連結
 *   （`ul.nav.ul-key`），單純瀏覽/導覽用，不是勾選狀態。
 * - 列表頁篩選面板（`page/_uc/searchma_tching.html`）：項目是可多選的
 *   checkbox（`.project_fx .form-check`）。
 *
 * 兩處的「大類 tab／子分類手風琴」互動邏輯完全一樣，差別只在最底層
 * 項目要渲染成連結還是核取方塊，所以共用這支元件，用 `variant` 切換，
 * 不用把同一套 tab/accordion 狀態管理寫兩次。
 *
 * 手風琴一開始的展開狀態：跟設計稿一致，每個大類底下*第一個*子分類
 * 預設展開，其餘收合；每個子分類各自獨立展開/收合（不是「同一時間
 * 只能開一個」的手風琴），對照設計稿裡每個 `.accordion-item` 各自有
 * 自己的 `aria-expanded`，不是互斥的。
 *
 * checkbox 目前只是畫面互動（可以勾/取消勾選），還沒有接到任何送出
 * 邏輯——跟 `DownloadRequestForm` 的提交按鈕一樣，先把畫面做出來，
 * 真的要接篩選/送出時再處理。
 */
export default function TechAttributeSelector({
  groups,
  name,
  variant,
}: {
  groups: TechAttributeGroup[];
  /** checkbox id 前綴，同一頁如果放兩份這個元件要給不同的 name 避免 id 衝突 */
  name: string;
  variant: "tags" | "checkboxes";
}) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) {
      group.sections.forEach((section, index) => {
        initial[section.id] = index === 0;
      });
    }
    return initial;
  });
  const [checkedValues, setCheckedValues] = useState<Record<string, boolean>>({});

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleValue(value: string) {
    setCheckedValues((prev) => ({ ...prev, [value]: !prev[value] }));
  }

  return (
    <div className="sm_techn d-flex">
      <div className="sm_techn_left" role="tablist" aria-label="技術分類選單">
        {groups.map((group) => (
          <button
            type="button"
            key={group.id}
            className={`tab-btn${group.id === activeGroupId ? " active" : ""}`}
            role="tab"
            id={`tab-${name}-${group.id}`}
            aria-selected={group.id === activeGroupId}
            aria-controls={`panel-${name}-${group.id}`}
            onClick={() => setActiveGroupId(group.id)}
          >
            {group.label} <i className="bi bi-chevron-right arrow-icon" aria-hidden="true"></i>
          </button>
        ))}
      </div>

      <div className="sm_techn_right flex-grow-1">
        {groups.map((group) => (
          <div
            key={group.id}
            id={`panel-${name}-${group.id}`}
            className={`tab-panel${group.id === activeGroupId ? "" : " d-none"}`}
            role="tabpanel"
            aria-labelledby={`tab-${name}-${group.id}`}
          >
            {group.sections.map((section) => {
              const isOpen = openSections[section.id];
              const bodyId = `collapse-${name}-${section.id}`;

              return (
                <div className="accordion-item mb-3" key={section.id}>
                  <button
                    type="button"
                    className="accordion-header btn-collapse"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="title-text">{section.label}</span>
                    <i className="bi bi-chevron-down toggle-icon" aria-hidden="true"></i>
                  </button>

                  <div id={bodyId} className={`collapse-body${isOpen ? " show" : ""}`} style={isOpen ? undefined : { display: "none" }}>
                    {variant === "tags" ? (
                      <ul className="nav ul-key mt-2">
                        {section.options.map((option) => (
                          <li key={option.value}>
                            <a href="#" title={option.label}>
                              {option.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="project_fx d-flex flex-wrap pt-2">
                        {section.options.map((option) => {
                          const checkboxId = `fx-${name}-${section.id}-${option.value}`;
                          return (
                            <div className="form-check" key={option.value}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={checkboxId}
                                checked={Boolean(checkedValues[option.value])}
                                onChange={() => toggleValue(option.value)}
                              />
                              <label className="form-check-label" htmlFor={checkboxId}>
                                {option.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
