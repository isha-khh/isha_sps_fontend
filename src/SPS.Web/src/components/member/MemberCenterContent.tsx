"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api/auth";
import MemberCenterNav, { getNavGroups, type MemberCenterRole, type MemberCenterSection } from "@/components/member/MemberCenterNav";
import ProfilePanel from "@/components/member/panels/ProfilePanel";
import UpgradePanel from "@/components/member/panels/UpgradePanel";
import CompanyPanel from "@/components/member/panels/CompanyPanel";
import ProductPanel from "@/components/member/panels/ProductPanel";
import PasswordPanel from "@/components/member/panels/PasswordPanel";
import PasskeyPanel from "@/components/member/panels/PasskeyPanel";
import MembersPanel from "@/components/member/panels/MembersPanel";
import MatchDataPanel from "@/components/member/panels/MatchDataPanel";
import FavoritesPanel from "@/components/member/panels/FavoritesPanel";
import RepliesPanel from "@/components/member/panels/RepliesPanel";
import { memberFavoritesApi } from "@/lib/api/member-favorites";

/**
 * 積木元件：會員中心（`/member`）主要內容——這是全新頁面，舊站
 * legacy 參考（`page/member/*.html`）完全沒有對應設計（查過
 * `nav.html`／`footer.html`，「會員中心」的連結一路都只指到
 * `login.html`），版面照現有站內既有 class 拼，不是照抄舊站畫面。
 *
 * 2026-10-06 起側邊欄的項目全部做完（基本資料、變更密碼、Passkey 管理、權益升級、公司資料、成員管理、
 * 產品相關資訊、媒合資料維護、我的最愛），下面「即將推出」的佔位只是保險。
 *
 * 2026-09-10 先做最小可用版本：掛載時用 `fetchProfile()`（打
 * `GET /api/Auth/profile`，Cookie 認證）確認登入狀態；只有「基本
 * 資料」真的接了真資料（`ProfilePanel.tsx` → `memberprofileApi`），
 * 其他側欄項目（公司資料／權益升級／媒合資料…）先顯示「即將推出」
 * 佔位內容——範圍怎麼分是跟使用者確認過的（見
 * docs/改版規劃.md 的 Phase 1/2/3 討論），不是漏做。
 */
export default function MemberCenterContent() {
  const router = useRouter();
  const { member, loading, fetchProfile, clear } = useAuthStore();
  const [active, setActive] = useState<MemberCenterSection>("profile");
  const [loggingOut, setLoggingOut] = useState(false);
  // 需求端／供給端：決定側邊欄有沒有「媒合資料維護」（刊登，需求端）與「我的回應」（供給端）
  const [role, setRole] = useState<MemberCenterRole>("");

  useEffect(() => {
    fetchProfile();
    memberFavoritesApi
      .getIds()
      .then((ids) => setRole(ids.role))
      .catch(() => {});
    // 只在掛載時查一次登入狀態
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // 就算登出 API 失敗，Cookie 過期時間到了也會失效，前端還是把本地狀態清掉、導去登入頁
    } finally {
      clear();
      router.push("/member/login");
    }
  }

  if (loading) {
    return <p className="text-muted">載入中…</p>;
  }

  if (!member) {
    return (
      <div className="frame-small-box">
        <p>
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          尚未登入或登入已過期，請重新登入。
        </p>
        <Link className="btn-theme" href="/member/login" title="前往登入">
          前往登入
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  // 有所屬公司＝企業會員：個人會員沒有「企業會員專屬」與「媒合」，已是企業會員的人也不需要「權益升級」
  const isEnterprise = Boolean(member.companyId);
  const activeLabel = getNavGroups(isEnterprise, role).flatMap((g) => g.items).find((item) => item.key === active)?.label ?? "";

  return (
    <div className="frame-small-box">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <p className="mb-0">
          您好，<strong>{member.name || member.email}</strong>
        </p>
        <button type="button" className="tier-reset-btn" onClick={handleLogout} disabled={loggingOut}>
          <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i>
          {loggingOut ? "登出中…" : "登出"}
        </button>
      </div>

      <div className="d-flex flex-wrap gap-4">
        <div style={{ flex: "0 0 220px" }}>
          <MemberCenterNav active={active} onSelect={setActive} isEnterprise={isEnterprise} role={role} />
        </div>

        <div style={{ flex: "1 1 400px" }}>
          <h3 className="mb-4 me_sho">{activeLabel}</h3>
          {active === "profile" ? (
            <ProfilePanel />
          ) : active === "upgrade" ? (
            <UpgradePanel />
          ) : active === "company" ? (
            <CompanyPanel />
          ) : active === "product" ? (
            <ProductPanel />
          ) : active === "password" ? (
            <PasswordPanel />
          ) : active === "passkey" ? (
            <PasskeyPanel />
          ) : active === "contact" ? (
            <MembersPanel />
          ) : active === "match_data" ? (
            <MatchDataPanel />
          ) : active === "my_replies" ? (
            <RepliesPanel />
          ) : active === "favorite" ? (
            <FavoritesPanel role={role} />
          ) : (
            <p className="text-muted">
              <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
              「{activeLabel}」即將推出，敬請期待。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
