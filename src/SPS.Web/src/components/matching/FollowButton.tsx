"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memberFavoritesApi } from "@/lib/api/member-favorites";
import { getApiErrorMessage } from "@/lib/error-utils";
import { loginHref } from "@/lib/login-next";
import { useMatchingContext } from "@/components/matching/useMatchingContext";

/**
 * 積木元件：媒合需求的「追蹤」按鈕（取代原本列表的「訂閱解方」與詳情頁需求的「加入最愛」）。
 * 只有需求端企業會員可以追蹤，追蹤後這筆需求的回應（後台審核通過後）會寄到會員信箱。
 * `variant="list"`：列表項目用，只有需求業者與訪客看到按鈕，其他身分整顆不顯示；
 * `variant="detail"`：詳情頁側欄用，其他身分顯示灰階按鈕加一行說明。
 */
export default function FollowButton({ demandId, variant }: { demandId: number; variant: "list" | "detail" }) {
  const { ready, role, followedIds, setFollowed } = useMatchingContext();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const followed = followedIds.includes(demandId);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await (followed ? memberFavoritesApi.removeDemand(demandId) : memberFavoritesApi.addDemand(demandId));
      setFollowed(demandId, !followed);
    } catch (err) {
      setError(getApiErrorMessage(err, "操作失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  const label = followed ? "已追蹤" : "追蹤";

  if (variant === "list") {
    if (ready && (role === "member" || role === "supplier")) return null;
    if (!ready || role === "guest") {
      return (
        <Link href={loginHref(pathname)} title="登入後追蹤此需求" className="connec_s more_x more_x_gu">
          <span>追蹤</span>
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      );
    }
    return (
      <>
        <a href="javascript:void(0)" title={followed ? "取消追蹤此需求" : "追蹤此需求"} aria-pressed={followed} className="connec_s more_x more_x_gu" onClick={() => void toggle()}>
          <span>{label}</span>
          <i className={`bi ${followed ? "bi-check2" : "bi-arrow-right"}`} aria-hidden="true" />
        </a>
        {error && <span className="d-block small text-danger" role="alert">{error}</span>}
      </>
    );
  }

  // detail
  if (!ready || role === "guest") {
    return (
      <div className="mb-4 text-center">
        <Link href={loginHref(pathname)} className="tier-reset-btn">
          <i className="bi bi-heart me-1" aria-hidden="true"></i>登入後追蹤此需求
        </Link>
      </div>
    );
  }
  if (role !== "buyer") {
    return (
      <div className="mb-4 text-center small text-muted">
        <i className="bi bi-heart me-1" aria-hidden="true"></i>
        {role === "supplier" ? "供應端企業會員無法追蹤需求" : "追蹤需求限需求端企業會員"}
      </div>
    );
  }
  return (
    <div className="mb-4 text-center">
      <button type="button" className="tier-reset-btn" onClick={() => void toggle()} disabled={busy} aria-pressed={followed} title={followed ? "取消追蹤" : "追蹤後，供應業者的回應會寄給您"}>
        <i className={`bi ${followed ? "bi-heart-fill" : "bi-heart"} me-1`} aria-hidden="true"></i>
        {followed ? "已追蹤此需求" : "追蹤此需求"}
      </button>
      <div className="small text-muted mt-1">追蹤後，供應業者的回應（審核通過後）會寄到您的信箱。</div>
      {error && <span className="d-block small text-danger" role="alert">{error}</span>}
    </div>
  );
}
