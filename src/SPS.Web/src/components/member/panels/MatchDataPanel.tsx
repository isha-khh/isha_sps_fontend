"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TagChecklists from "@/components/matching/TagChecklists";
import { memberFavoritesApi, type MemberDemand } from "@/lib/api/member-favorites";
import { useTagTaxonomy } from "@/lib/use-tag-taxonomy";
import { getApiErrorMessage } from "@/lib/error-utils";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("zh-TW");
}

/**
 * 積木元件：會員中心「媒合資料維護」面板——企業會員在媒合對接用「我要刊登」送出的需求，在這裡看審核進度、
 * 修改或撤回。**待審核**的可以改標題、內容與標籤、也可以撤回；**已上架**的不能自己改（內容已公開，要改請聯絡承辦單位）。
 * 接 `GET/PUT/DELETE /api/member/demands`；後端只允許操作自己刊登的需求。
 */
export default function MatchDataPanel() {
  const { taxonomy } = useTagTaxonomy();
  const [demands, setDemands] = useState<MemberDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [editing, setEditing] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setDemands(await memberFavoritesApi.getMyDemands());
    } catch (err) {
      setError(getApiErrorMessage(err, "載入需求失敗"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    memberFavoritesApi
      .getMyDemands()
      .then((data) => active && setDemands(data))
      .catch((err) => active && setError(getApiErrorMessage(err, "載入需求失敗")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function openEdit(demand: MemberDemand) {
    setEditing(demand.id);
    setTitle(demand.name);
    setContent(demand.introduction ?? "");
    setChecked(Object.fromEntries(demand.tagIds.map((id) => [String(id), true])));
    setError(undefined);
    setMessage(undefined);
  }

  async function save(id: number) {
    setError(undefined);
    setMessage(undefined);
    const tagIds = Object.entries(checked)
      .filter(([, on]) => on)
      .map(([tagId]) => Number(tagId));
    if (!title.trim()) return setError("請輸入需求標題");
    if (tagIds.length === 0) return setError("請至少選擇一個標籤");
    setBusy(true);
    try {
      await memberFavoritesApi.updateMyDemand(id, { name: title.trim(), introduction: content.trim() || null, tagIds });
      setEditing(null);
      setMessage("已更新需求，審核通過後才會上架。");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "更新失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(demand: MemberDemand) {
    if (!window.confirm(`確定要撤回「${demand.name}」嗎？撤回後無法復原。`)) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await memberFavoritesApi.deleteMyDemand(demand.id);
      if (editing === demand.id) setEditing(null);
      setMessage("已撤回需求");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "撤回失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted">載入中…</p>;

  return (
    <div>
      <p className="small text-muted">
        這裡列出您在媒合對接送出的需求。送出後要經承辦單位審核才會上架；待審核的可以修改或撤回，已上架的如需修改請聯絡承辦單位。
      </p>

      {message && (
        <p className="text-success">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      {demands.length === 0 ? (
        <p className="text-muted">
          您還沒有刊登過需求。企業會員可以到 <Link href="/matching">媒合對接</Link> 按「我要刊登」送出需求。
        </p>
      ) : (
        <div className="d-grid gap-3">
          {demands.map((demand) => (
            <div key={demand.id} className="border rounded p-3">
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <div>
                  <strong>{demand.name}</strong>
                  <span className={`badge ms-2 ${demand.published ? "bg-success" : "bg-warning text-dark"}`}>{demand.published ? "已上架" : "待審核"}</span>
                  <div className="small text-muted">
                    編號 {demand.number}　送出於 {formatDate(demand.createdTime)}
                  </div>
                  {demand.tagNames.length > 0 && <div className="small text-muted">{demand.tagNames.join("、")}</div>}
                  {demand.published && (
                    <div className="mt-1">
                      <Link href={`/matching/${demand.id}`} className="blue">
                        查看公開頁面
                      </Link>
                    </div>
                  )}
                </div>
                {!demand.published && (
                  <div className="d-flex gap-2 align-items-start">
                    <button type="button" className="tier-reset-btn" onClick={() => openEdit(demand)} disabled={busy}>
                      修改
                    </button>
                    <button type="button" className="tier-reset-btn text-danger" onClick={() => void withdraw(demand)} disabled={busy}>
                      撤回
                    </button>
                  </div>
                )}
              </div>

              {editing === demand.id && (
                <div className="mt-3">
                  <div className="form-group mb-3">
                    <label className="mb-2" htmlFor={`md-title-${demand.id}`}>
                      需求標題
                    </label>
                    <input id={`md-title-${demand.id}`} type="text" className="form-control" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="form-group mb-3">
                    <label className="mb-2" htmlFor={`md-content-${demand.id}`}>
                      需求內容
                    </label>
                    <textarea id={`md-content-${demand.id}`} className="form-control" rows={5} maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} />
                  </div>
                  <TagChecklists
                    taxonomy={taxonomy}
                    checked={checked}
                    onToggle={(value) => setChecked((prev) => ({ ...prev, [value]: !prev[value] }))}
                    idPrefix={`md-${demand.id}`}
                  />
                  <div className="d-flex gap-2 mt-3">
                    <button type="button" className="tier-submit-btn" onClick={() => void save(demand.id)} disabled={busy}>
                      <span>{busy ? "儲存中…" : "儲存"}</span>
                    </button>
                    <button type="button" className="tier-reset-btn" onClick={() => setEditing(null)} disabled={busy}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
