"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { readNextFromLocation } from "@/lib/login-next";

/**
 * 登入、忘記密碼、註冊這幾頁是給「還沒登入」的人用的：已經登入的會員進來沒有意義（也容易搞混），
 * 掛上這個元件就會改導去會員中心。登入狀態用 `GET /api/Auth/session` 查（沒登入也回 200，不會被導去登入頁），
 * 整個網站共用同一份結果，頁首的「會員中心」選單也是看同一份。不放在需要匿名訪問的頁面（例如申請進度查詢、重設密碼連結）。
 */
export default function RedirectIfLoggedIn({ to = "/member" }: { to?: string }) {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (member) router.replace(readNextFromLocation() ?? to);
  }, [member, router, to]);

  return null;
}
