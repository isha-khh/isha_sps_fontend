"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMatchingContext } from "@/components/matching/useMatchingContext";
import { loginHref } from "@/lib/login-next";

/**
 * 積木元件：需求詳情側欄的「我要回應」按鈕。只有供應業者可以開啟回應彈窗（`modalId`）；
 * 訪客導去登入（登入後回到這頁）；一般會員與需求業者顯示灰階按鈕加說明。
 */
export default function ReplyNeedButton({ modalId }: { modalId: string }) {
  const { ready, role } = useMatchingContext();
  const pathname = usePathname();

  if (ready && role === "supplier") {
    return (
      <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target={`#${modalId}`} className="me_Publish more_x">
        <span>我要回應</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </a>
    );
  }

  if (!ready || role === "guest") {
    return (
      <Link href={loginHref(pathname)} className="me_Publish more_x" title="登入後回應需求">
        <span>我要回應</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <a href="javascript:void(0)" className="me_Publish more_x" aria-disabled="true" style={{ opacity: 0.5 }}>
        <span>我要回應</span>
        <i className="bi bi-pencil-square" aria-hidden="true" />
      </a>
      <p className="small mt-2 mb-3" style={{ color: "#6b3f00" }}>
        {role === "buyer" ? "需求端企業會員無法回應需求，可以追蹤此需求等待供應業者的回應。" : "回應需求限供應端企業會員。個人會員可到會員中心「權益升級」申請成為企業會員。"}
      </p>
    </>
  );
}
