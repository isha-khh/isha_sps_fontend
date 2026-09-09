"use client";

import { useEffect, useRef, useState } from "react";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import { APPLICATION_SCENARIOS, APPLICATION_SCOPES, TECH_ATTRIBUTE_GROUPS } from "@/lib/matching-data";

type PanelId = "scenario" | "scope" | "tech";

/**
 * 積木元件：企業名錄列表頁頂部搜尋列，對應設計稿
 * `page/_uc/searchma_tching.html` 的 `.matching_sear`——關鍵字輸入框
 * ＋三個浮動篩選面板（應用情境／應用範疇／智慧技術，皆可多選）。
 *
 * 設計稿原本是用 jQuery（`.btn-filter-toggle` 點擊切換面板、點空白處
 * 關閉、ESC 關閉），這裡改成純 React state——這個互動元件是全新的
 * （沒有舊頁面在用同一段 jQuery），不像 Headers.tsx 那種要跟既有
 * jQuery 插件搶控制權的情況，直接用這個專案比較新的元件（如
 * MarqueeTrack）偏好的寫法，不用另外掛 jQuery 事件代理。
 *
 * 查詢按鈕跟 checkbox 目前都只是畫面互動，沒有接任何篩選/送出邏輯
 * ——跟 `DownloadRequestForm` 一樣，先把畫面做出來，真的要接資料時
 * 再處理「查詢」要怎麼把這些勾選狀態送出去（回傳網址 query string，
 * 還是純前端篩選，要看那時候資料量/後端 API 的設計）。
 */
export default function MatchingSearchBar() {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [checkedScenarios, setCheckedScenarios] = useState<Record<string, boolean>>({});
  const [checkedScopes, setCheckedScopes] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function togglePanel(panel: PanelId) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  function toggleChecked(setter: typeof setCheckedScenarios, value: string) {
    setter((prev) => ({ ...prev, [value]: !prev[value] }));
  }

  const filterButtons: { id: PanelId; label: string }[] = [
    { id: "scenario", label: "應用情境" },
    { id: "scope", label: "應用範疇" },
    { id: "tech", label: "智慧技術" },
  ];

  return (
    <div className="matching_sear d-flex position-relative" ref={containerRef}>
      <div className="input-group mt-2 mt-md-0">
        <input type="text" className="form-control" placeholder="請輸入關鍵字" aria-label="請輸入關鍵字" />
      </div>

      <div className="matching_sear_mid">
        <ul className="nav">
          {filterButtons.map((button) => (
            <li key={button.id}>
              <button
                type="button"
                className={`btn-filter-toggle${openPanel === button.id ? " active" : ""}`}
                aria-haspopup="dialog"
                aria-expanded={openPanel === button.id}
                aria-controls={`filter_panel_${button.id}`}
                onClick={() => togglePanel(button.id)}
              >
                <span className="me-1">{button.label}</span>
                <i className="bi bi-chevron-down toggle-icon" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="btn_a" title="查詢">
        <i className="bi bi-search me-1"></i>
        <span>查詢</span>
      </button>

      {/* 1. 應用情境 */}
      <div className="ma_sear_1 ma_sear_panel" id="filter_panel_scenario" style={openPanel === "scenario" ? undefined : { display: "none" }}>
        <div className="menb_inp_tit form-group">
          <label className="mb-2 fw-bold">應用情境(可多選)</label>
          <div className="project_fx project_three d-flex flex-wrap gap-2">
            {APPLICATION_SCENARIOS.map((scenario) => {
              const id = `fxContext-${scenario}`;
              return (
                <div className="form-check" key={scenario}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={Boolean(checkedScenarios[scenario])}
                    onChange={() => toggleChecked(setCheckedScenarios, scenario)}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    {scenario}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. 應用範疇 */}
      <div className="ma_sear_1 ma_sear_panel" id="filter_panel_scope" style={openPanel === "scope" ? undefined : { display: "none" }}>
        <div className="menb_inp_tit form-group w-100">
          <div className="project_fx d-flex flex-wrap">
            {APPLICATION_SCOPES.map((scope) => {
              const id = `fxScope-${scope}`;
              return (
                <div className="form-check" key={scope}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={Boolean(checkedScopes[scope])}
                    onChange={() => toggleChecked(setCheckedScopes, scope)}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    {scope}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 智慧技術 */}
      <div className="ma_sear_1 ma_sear_panel" id="filter_panel_tech" style={openPanel === "tech" ? undefined : { display: "none" }}>
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>智慧技術(可多選)
          </label>
          <TechAttributeSelector groups={TECH_ATTRIBUTE_GROUPS} name="filter" variant="checkboxes" />
        </div>
      </div>
    </div>
  );
}
