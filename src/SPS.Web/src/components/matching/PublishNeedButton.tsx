"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMatchingContext } from "@/components/matching/useMatchingContext";
import { loginHref } from "@/lib/login-next";

/**
 * 積木元件：媒合對接列表側欄的「我要刊登」按鈕，依身分決定狀態（業務規格見 `docs/媒合對接業務規格-2026-10-08.md`）：
 * - 需求業者：開啟刊登彈窗（`modalId`）；
 * - 訪客：導去登入頁，登入後回到這頁；
 * - 一般會員（個人會員）：說明刊登限需求端企業會員，指向會員中心升級；
 * - 供應業者：按鈕灰階，說明供應端不能刊登。
 * 身分判斷用 `GET /api/member/favorites/ids`（沒登入也可以呼叫），載入完成前先當訪客，避免閃動的是按鈕文字而不是行為。
 */
export default function PublishNeedButton({ modalId }: { modalId: string }) {
  const { ready, role } = useMatchingContext();
  const pathname = usePathname();
  const [notice, setNotice] = useState<string | null>(null);

  if (ready && role === "buyer") {
    return (
      <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target={`#${modalId}`} className="me_Publish more_x">
        <span>我要刊登</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </a>
    );
  }

  if (!ready || role === "guest") {
    return (
      <Link href={loginHref(pathname)} className="me_Publish more_x" title="登入後刊登需求">
        <span>我要刊登</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </Link>
    );
  }

  const message =
    role === "member"
      ? "刊登需求限需求端企業會員。個人會員可到會員中心「權益升級」申請成為企業會員。"
      : "供應端企業會員無法刊登需求，可以到需求頁面回應。";

  return (
    <>
      <a
        href="javascript:void(0)"
        className="me_Publish more_x"
        aria-disabled="true"
        style={role === "supplier" ? { opacity: 0.5 } : undefined}
        onClick={() => setNotice(message)}
      >
        <span>我要刊登</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </a>
      {notice && (
        <p className="small mt-2" role="status" style={{ color: "#6b3f00" }}>
          {notice}
          {role === "member" && (
            <>
              {" "}
              <Link href="/member">前往會員中心</Link>
            </>
          )}
        </p>
      )}
    </>
  );
}
