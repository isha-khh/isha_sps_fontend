"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { memberFavoritesApi, type MemberFavorites } from "@/lib/api/member-favorites";
import { getApiErrorMessage } from "@/lib/error-utils";

/**
 * 積木元件：會員中心「我的最愛」面板——在企業名錄詳情與媒合需求詳情按「加入最愛」收藏的項目。
 * 接 `GET /api/member/favorites`；只列目前公開的（企業要已審核且啟用、需求要已發布），下架的不顯示但收藏紀錄保留。
 */
export default function FavoritesPanel() {
  const [favorites, setFavorites] = useState<MemberFavorites>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setFavorites(await memberFavoritesApi.getFavorites());
    } catch (err) {
      setError(getApiErrorMessage(err, "載入我的最愛失敗"));
    }
  }, []);

  useEffect(() => {
    let active = true;
    memberFavoritesApi
      .getFavorites()
      .then((data) => active && setFavorites(data))
      .catch((err) => active && setError(getApiErrorMessage(err, "載入我的最愛失敗")));
    return () => {
      active = false;
    };
  }, []);

  async function remove(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await action();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "移除失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  if (!favorites && !error) return <p className="text-muted">載入中…</p>;

  return (
    <div>
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      {favorites && (
        <>
          <h4 className="h5 mb-3">收藏的企業</h4>
          {favorites.companies.length === 0 ? (
            <p className="text-muted">
              還沒有收藏的企業。到 <Link href="/matching/enterprise">企業名錄</Link> 的企業頁面按「加入最愛」。
            </p>
          ) : (
            <div className="d-grid gap-2 mb-4">
              {favorites.companies.map((company) => (
                <div key={company.id} className="border rounded p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <Link href={`/matching/enterprise/${company.id}`} className="blue">
                      <strong>{company.name}</strong>
                    </Link>
                    {company.subject && <div className="small text-muted">{company.subject}</div>}
                  </div>
                  <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void remove(() => memberFavoritesApi.removeCompany(company.id))}>
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}

          <h4 className="h5 mb-3">收藏的需求</h4>
          {favorites.demands.length === 0 ? (
            <p className="text-muted">
              還沒有收藏的需求。到 <Link href="/matching">媒合對接</Link> 的需求頁面按「加入最愛」。
            </p>
          ) : (
            <div className="d-grid gap-2">
              {favorites.demands.map((demand) => (
                <div key={demand.id} className="border rounded p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <Link href={`/matching/${demand.id}`} className="blue">
                      <strong>{demand.name}</strong>
                    </Link>
                    <div className="small text-muted">
                      編號 {demand.number}
                      {demand.location ? `　${demand.location}` : ""}
                    </div>
                  </div>
                  <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void remove(() => memberFavoritesApi.removeDemand(demand.id))}>
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
