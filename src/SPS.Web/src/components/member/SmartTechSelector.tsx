"use client";

import { useState } from "react";
import { SMART_TECH_TABS } from "@/lib/member-registration-data";

/**
 * 積木元件：「智慧技術(可多選)」左側頁籤＋右側手風琴巢狀 checkbox，
 * 對應 p02/p03.html 的 `.sm_techn`（舊站用 jQuery 切換 `.d-none`／
 * `slideDown`/`slideUp`，這裡改成 React state，視覺行為一致：同時間
 * 只顯示一個頁籤內容，手風琴可個別收合/展開）。
 *
 * `disabled` 對應 p03.html（Step 4 完成註冊）把所有 checkbox 都設成
 * disabled 的唯讀檢視模式；頁籤/手風琴本身仍可切換瀏覽，只是勾選框
 * 不能再改。
 */
export default function SmartTechSelector({ disabled = false }: { disabled?: boolean }) {
  const [activeTab, setActiveTab] = useState(SMART_TECH_TABS[0].id);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const tab of SMART_TECH_TABS) {
      for (const section of tab.sections) {
        initial[section.id] = Boolean(section.defaultOpen);
      }
    }
    return initial;
  });

  return (
    <div className="sm_techn d-flex">
      <div className="sm_techn_left" role="tablist" aria-label="技術分類選單">
        {SMART_TECH_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "tab-btn active" : "tab-btn"}
            role="tab"
            id={`tab_${tab.id}`}
            aria-selected={tab.id === activeTab}
            aria-controls={`panel_${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} <i className="bi bi-chevron-right arrow-icon" aria-hidden="true"></i>
          </button>
        ))}
      </div>

      <div className="sm_techn_right flex-grow-1">
        {SMART_TECH_TABS.map((tab) => (
          <div key={tab.id} id={`panel_${tab.id}`} className={tab.id === activeTab ? "tab-panel" : "tab-panel d-none"} role="tabpanel" aria-labelledby={`tab_${tab.id}`}>
            {tab.sections.map((section) => {
              const isOpen = openSections[section.id];
              return (
                <div className="accordion-item mb-3" key={section.id}>
                  <button
                    type="button"
                    className="accordion-header btn-collapse"
                    aria-expanded={isOpen}
                    aria-controls={`collapse_${section.id}`}
                    onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                  >
                    <span className="title-text">{section.title}</span>
                    <i className="bi bi-chevron-down toggle-icon" aria-hidden="true"></i>
                  </button>

                  <div id={`collapse_${section.id}`} className={isOpen ? "collapse-body show" : "collapse-body"} style={isOpen ? undefined : { display: "none" }}>
                    <div className="project_fx d-flex flex-wrap gap-3 pt-2">
                      {section.options.map((option, index) => {
                        const inputId = `fxScope_${section.id}_${index}`;
                        return (
                          <div className="form-check" key={inputId}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value={option.value}
                              id={inputId}
                              defaultChecked={option.defaultChecked}
                              disabled={disabled}
                            />
                            <label className="form-check-label" htmlFor={inputId}>
                              {option.value}
                            </label>
                          </div>
                        );
                      })}
                    </div>
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
