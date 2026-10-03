"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/api-client";

/**
 * 積木元件：記錄 Banner 曝光次數（不渲染任何畫面）。
 *
 * 後台「橫幅管理」會顯示每個 Banner 的瀏覽次數（`POST /api/Banner/views`），前台以前從來沒呼叫過，
 * 數字永遠是 0。這裡把「這頁載入時顯示的所有 Banner id」一次送出，定義是「頁面載入時出現」，
 * 不是捲動到可視範圍才算——輪播的每一張都算一次曝光，簡單但夠用來比較各 Banner 的相對表現。
 *
 * 同一個瀏覽分頁（sessionStorage）對同一組 Banner 只送一次，重新整理不重複計；後端另外有
 * 「同 IP、同一個 Banner 30 分鐘內只算一次」與「只算上架中的 Banner」的防灌水。失敗就吞掉。
 * 跟 `TrackedLink` 一樣刻意用 `fetch`、不走 axios：這是匿名計數 API，不需要先抓 CSRF token。
 */
export default function BannerImpressions({ ids }: { ids: number[] }) {
    // 依賴用字串：父層每次 render 傳進來的是新陣列，直接放 ids 會重複觸發
    const key = [...ids].sort((a, b) => a - b).join(",");

    useEffect(() => {
        if (!key) return;
        const storageKey = `banner-viewed:${key}`;
        try {
            if (sessionStorage.getItem(storageKey)) return;
            sessionStorage.setItem(storageKey, "1");
        } catch {
            // 隱私模式等情況存取 sessionStorage 會丟例外：照送，頂多重複由後端去重擋掉
        }

        const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");
        const path = "/api/Banner/views";
        fetch(apiBase ? `${apiBase}${path}` : withBasePath(path), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: key.split(",").map(Number) }),
            keepalive: true,
            credentials: "include",
        }).catch(() => {});
    }, [key]);

    return null;
}
