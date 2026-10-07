"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { memberFavoritesApi } from "@/lib/api/member-favorites";
import { getApiErrorMessage } from "@/lib/error-utils";

/**
 * 積木元件：「加入最愛」按鈕，放在企業名錄詳情與媒合需求詳情頁，收藏的項目顯示在會員中心「我的最愛」。
 * 掛載時呼叫 `GET /api/member/favorites/ids` 判斷目前狀態——這支端點沒登入也能呼叫（回 `loggedIn: false`），
 * 所以匿名瀏覽不會被導去登入頁；沒登入時按下按鈕才導去登入頁。
 */
export default function FavoriteButton({ kind, id, className }: { kind: "company" | "demand"; id: string | number; className?: string }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  // 個人會員不能使用我的最愛（跟媒合內容一樣是企業會員功能），已登入但不是企業會員就整顆不顯示
  const [allowed, setAllowed] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    memberFavoritesApi
      .getIds()
      .then((ids) => {
        if (cancelled) return;
        setLoggedIn(ids.loggedIn);
        setAllowed(!ids.loggedIn || ids.enterprise);
        setFavorited(kind === "company" ? ids.companyIds.includes(String(id)) : ids.demandIds.includes(Number(id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  async function toggle() {
    if (busy) return;
    if (!loggedIn) {
      router.push("/member/login");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      if (kind === "company") {
        await (favorited ? memberFavoritesApi.removeCompany(String(id)) : memberFavoritesApi.addCompany(String(id)));
      } else {
        await (favorited ? memberFavoritesApi.removeDemand(Number(id)) : memberFavoritesApi.addDemand(Number(id)));
      }
      setFavorited(!favorited);
    } catch (err) {
      setError(getApiErrorMessage(err, "操作失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) return null;

  return (
    <span className={className}>
      <button type="button" className="tier-reset-btn" onClick={() => void toggle()} disabled={busy} aria-pressed={favorited} title={favorited ? "從我的最愛移除" : "加入我的最愛"}>
        <i className={`bi ${favorited ? "bi-heart-fill" : "bi-heart"} me-1`} aria-hidden="true"></i>
        {favorited ? "已加入最愛" : "加入最愛"}
      </button>
      {error && (
        <span className="d-block small text-danger" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
