"use client";

import { useCallback, useEffect, useState } from "react";
import { memberFavoritesApi, type FavoriteIds } from "@/lib/api/member-favorites";

/** 媒合對接頁依身分決定按鈕狀態：訪客、一般會員（個人會員）、需求業者、供應業者 */
export type MatchingRole = "guest" | "member" | "buyer" | "supplier";

export interface MatchingContext {
  ready: boolean;
  role: MatchingRole;
  /** 目前追蹤中的需求 id（只有需求業者有值） */
  followedIds: number[];
}

const INITIAL: MatchingContext = { ready: false, role: "guest", followedIds: [] };

function toContext(ids: FavoriteIds): MatchingContext {
  if (!ids.loggedIn) return { ready: true, role: "guest", followedIds: [] };
  const role: MatchingRole = ids.role === "Buyer" ? "buyer" : ids.role === "Supplier" ? "supplier" : "member";
  return { ready: true, role, followedIds: ids.demandIds };
}

// 列表頁每個項目都有追蹤按鈕，共用同一次請求，避免一頁打 8 次 API；有變動（追蹤、取消追蹤）就清掉重抓
let inflight: Promise<MatchingContext> | null = null;

function load(): Promise<MatchingContext> {
  if (!inflight) {
    inflight = memberFavoritesApi
      .getIds()
      .then(toContext)
      .catch(() => ({ ready: true, role: "guest" as MatchingRole, followedIds: [] }))
      .finally(() => {
        setTimeout(() => {
          inflight = null;
        }, 3000);
      });
  }
  return inflight;
}

export function invalidateMatchingContext() {
  inflight = null;
}

/** 目前登入者在媒合對接的身分（沒登入也可以呼叫，不會被導去登入頁） */
export function useMatchingContext(): MatchingContext & { setFollowed: (id: number, followed: boolean) => void } {
  const [ctx, setCtx] = useState<MatchingContext>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    load().then((value) => {
      if (!cancelled) setCtx(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setFollowed = useCallback((id: number, followed: boolean) => {
    invalidateMatchingContext();
    setCtx((prev) => ({
      ...prev,
      followedIds: followed ? Array.from(new Set([...prev.followedIds, id])) : prev.followedIds.filter((x) => x !== id),
    }));
  }, []);

  return { ...ctx, setFollowed };
}
