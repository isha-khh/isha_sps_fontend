"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import type { TagTaxonomy } from "@/lib/company-tags";

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
 * 2026-10-06：篩選條件全部放在網址（`?q=關鍵字&tags=標籤id,標籤id`），企業名錄與媒合需求兩頁共用，
 * 由各頁的 Server Component 交給後端查詢；三個面板的選項來自後台「分類管理」的企業標籤
 * （`fetchTagTaxonomy`），不再寫死。多個標籤的規則是「符合任一勾選項目」。
 */
export default function MatchingSearchBar({
  defaultKeyword = "",
  taxonomy,
  selectedTagIds = [],
}: {
  defaultKeyword?: string;
  taxonomy: TagTaxonomy;
  selectedTagIds?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState(defaultKeyword);

  function submitSearch() {
    const params = new URLSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) params.set("q", trimmed);
    const tagIds = Object.entries(checked)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (tagIds.length > 0) params.set("tags", tagIds.join(","));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleChecked(value: string) {
    setChecked((prev) => ({ ...prev, [value]: !prev[value] }));
  }


  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  // 勾選狀態一律用標籤 id（字串）當 key，三個面板共用同一份
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(selectedTagIds.map((id) => [String(id), true])));
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

  const filterButtons: { id: PanelId; label: string }[] = [
    { id: "scenario", label: "應用情境" },
    { id: "scope", label: "應用範疇" },
    { id: "tech", label: "智慧技術" },
  ];

  return (
    <div className="matching_sear d-flex position-relative" ref={containerRef}>
      <div className="input-group mt-2 mt-md-0">
        <input
          type="text"
          className="form-control"
          placeholder="請輸入關鍵字"
          aria-label="請輸入關鍵字"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
          }}
        />
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

      <button type="button" className="btn_a" title="查詢" onClick={submitSearch}>
        <i className="bi bi-search me-1"></i>
        <span>查詢</span>
      </button>

      {/* 1. 應用情境 */}
      <div className="ma_sear_1 ma_sear_panel" id="filter_panel_scenario" style={openPanel === "scenario" ? undefined : { display: "none" }}>
        <div className="menb_inp_tit form-group">
          <label className="mb-2 fw-bold">應用情境(可多選)</label>
          <div className="project_fx project_three d-flex flex-wrap gap-2">
            {taxonomy.scenarios.map((tag) => {
              const id = `fxContext-${tag.id}`;
              return (
                <div className="form-check" key={tag.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={Boolean(checked[String(tag.id)])}
                    onChange={() => toggleChecked(String(tag.id))}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    {tag.name}
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
            {taxonomy.scopes.map((tag) => {
              const id = `fxScope-${tag.id}`;
              return (
                <div className="form-check" key={tag.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={Boolean(checked[String(tag.id)])}
                    onChange={() => toggleChecked(String(tag.id))}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    {tag.name}
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
          <TechAttributeSelector groups={taxonomy.techGroups} name="filter" variant="checkboxes" checked={checked} onToggle={toggleChecked} />
        </div>
      </div>
    </div>
  );
}
