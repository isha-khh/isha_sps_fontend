"use client";

import { useEffect, useState } from "react";
import { memberFavoritesApi, type MatchCompanyOption, type MemberDemand } from "@/lib/api/member-favorites";
import { getApiErrorMessage } from "@/lib/error-utils";

/** 一筆需求最多對接幾家（後端同一個上限） */
const MAX_COMPANIES = 20;

/**
 * 積木元件：「媒合資料維護」裡已上架需求的**對接結果**（issue #98）。需求成功對接後，刊登端（刊登的會員與同一家公司的會員）
 * 在這裡選對接到哪些供給端企業（可以多家）並送出——送出後前台公開頁的狀態就從「徵求中」變成「已成功對接」，不需要審核；
 * 對接到哪些企業只有自己（同公司會員）與後台看得到，前台不公開。之後可以再修改，全部移除就回到「徵求中」。
 * 接 `PUT /api/member/demands/{id}/matches`、`GET /api/Demand/match-companies`。
 */
export default function MatchResultEditor({ demand, onSaved }: { demand: MemberDemand; onSaved: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<MatchCompanyOption[]>([]);
  // 選項是針對哪個關鍵字查的；跟目前輸入的不同就是還在搜尋中（不需要在 effect 裡同步設狀態）
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const searching = searchedFor !== search.trim();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  function openEditor() {
    setSelected(demand.matchedCompanies.map((c) => ({ id: c.companyId, name: c.companyName })));
    setSearch("");
    setError(undefined);
    setMessage(undefined);
    setOpen(true);
  }

  // 展開後載入選項；輸入關鍵字時稍等一下再查，不要每打一個字就打一次 API
  useEffect(() => {
    if (!open) return;
    let active = true;
    const keyword = search.trim();
    const timer = window.setTimeout(() => {
      memberFavoritesApi
        .searchMatchCompanies(keyword)
        .then((rows) => {
          if (!active) return;
          setOptions(rows);
          setSearchedFor(keyword);
        })
        .catch(() => {
          if (!active) return;
          setOptions([]);
          setSearchedFor(keyword);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, search]);

  function add(option: MatchCompanyOption) {
    if (selected.some((s) => s.id === option.id)) return;
    if (selected.length >= MAX_COMPANIES) return setError(`最多填報 ${MAX_COMPANIES} 家對接企業`);
    setError(undefined);
    setSelected((prev) => [...prev, { id: option.id, name: option.name }]);
  }

  async function submit() {
    if (selected.length === 0 && demand.matched && !window.confirm("沒有選任何企業，送出後這筆需求會回到「徵求中」。確定嗎？")) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const result = await memberFavoritesApi.setMyDemandMatches(
        demand.id,
        selected.map((s) => s.id),
      );
      setOpen(false);
      setMessage(result.matched ? "已送出，這筆需求在前台已顯示為「已成功對接」。" : "已移除對接結果，這筆需求回到「徵求中」。");
      await onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "送出失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  const available = options.filter((o) => !selected.some((s) => s.id === o.id));

  return (
    <div className="mt-3 pt-3 border-top">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <strong>對接結果</strong>
          <span className={`badge ms-2 ${demand.matched ? "bg-success" : "bg-secondary"}`}>{demand.matched ? "已成功對接" : "徵求中"}</span>
          {demand.matched && demand.matchedCompanies.length > 0 && (
            <div className="small mt-1">對接企業：{demand.matchedCompanies.map((c) => c.companyName).join("、")}</div>
          )}
          <div className="small text-muted">需求已經成功對接時，請填報對接到哪些供給端企業；前台只會顯示「已成功對接」，不會公開是哪幾家。</div>
        </div>
        {!open && (
          <button type="button" className="tier-reset-btn" onClick={openEditor} disabled={busy}>
            {demand.matched ? "修改對接結果" : "填報對接結果"}
          </button>
        )}
      </div>

      {message && (
        <p className="text-success small mb-0 mt-2">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}

      {open && (
        <div className="mt-3">
          <div className="mb-2">
            <div className="small mb-1">
              已選擇的對接企業（{selected.length}／{MAX_COMPANIES}）
            </div>
            {selected.length === 0 ? (
              <div className="small text-muted">還沒選。{demand.matched ? "全部移除後送出，需求會回到「徵求中」。" : "請從下面搜尋並加入。"}</div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {selected.map((s) => (
                  <span key={s.id} className="badge bg-primary d-inline-flex align-items-center gap-1" style={{ fontSize: "0.9rem", fontWeight: 400 }}>
                    {s.name}
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      style={{ fontSize: "0.6rem" }}
                      aria-label={`移除 ${s.name}`}
                      onClick={() => setSelected((prev) => prev.filter((p) => p.id !== s.id))}
                      disabled={busy}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group mb-2">
            <label className="mb-1" htmlFor={`mr-search-${demand.id}`}>
              搜尋供給端企業（名稱或編號）
            </label>
            <input id={`mr-search-${demand.id}`} type="search" className="form-control" maxLength={50} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="輸入企業名稱關鍵字" />
          </div>
          <div className="border rounded" style={{ maxHeight: 220, overflowY: "auto" }}>
            {searching && available.length === 0 ? (
              <div className="p-2 small text-muted">搜尋中…</div>
            ) : available.length === 0 ? (
              <div className="p-2 small text-muted">沒有符合的企業</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {available.map((o) => (
                  <li key={o.id} className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom">
                    <span className="small">
                      {o.name}
                      {o.number && <span className="text-muted ms-2">{o.number}</span>}
                    </span>
                    <button type="button" className="tier-reset-btn" onClick={() => add(o)} disabled={busy || selected.length >= MAX_COMPANIES}>
                      加入
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-danger small mt-2 mb-0" role="alert">
              <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
              {error}
            </p>
          )}
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="tier-submit-btn" onClick={() => void submit()} disabled={busy}>
              <span>{busy ? "送出中…" : "送出"}</span>
            </button>
            <button type="button" className="tier-reset-btn" onClick={() => setOpen(false)} disabled={busy}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
