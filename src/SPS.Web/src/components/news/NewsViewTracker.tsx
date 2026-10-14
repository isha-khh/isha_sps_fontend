"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/api-client";

/**
 * 積木元件：公告詳情頁的瀏覽數記錄（不渲染任何畫面）。
 *
 * 後端早就有 `POST /api/News/{id}/view`，「熱門公告」排行（`sortNewsByViewCount`）也是靠
 * `viewCount` 排的，但前台以前從來沒呼叫過，數字永遠停在匯入時的值。
 *
 * 不只公告：服務專區（技術工具）、補助公告、人才培育、產業輔導都是同一張 `News` 資料表，
 * 詳情頁一樣掛這個；推廣專區的產業案例用 `kind="SuccessCase"`（`POST /api/SuccessCase/{id}/view`）。
 * 這些頁面原本都沒有掛，後台的瀏覽數與「熱門課程／熱門輔導／熱門案例」排行永遠不會動。
 *
 * 進頁面時送一次；同一個瀏覽分頁（sessionStorage）對同一篇只送一次，重新整理不重複計。
 * 後端另外有「同 IP、同一篇 30 分鐘內只算一次」的防灌水。記錄失敗就吞掉，不影響閱讀。
 * 跟 `TrackedLink` 一樣刻意用 `fetch`、不走 axios：這是匿名計數 API，不需要先抓 CSRF token。
 */
export default function NewsViewTracker({ newsId, kind = "News" }: { newsId: number | string; kind?: "News" | "SuccessCase" }) {
    useEffect(() => {
        const storageKey = kind === "News" ? `news-viewed:${newsId}` : `${kind}-viewed:${newsId}`;
        try {
            if (sessionStorage.getItem(storageKey)) return;
            sessionStorage.setItem(storageKey, "1");
        } catch {
            // 隱私模式等情況存取 sessionStorage 會丟例外：照送，頂多重複由後端去重擋掉
        }

        const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");
        const path = `/api/${kind}/${newsId}/view`;
        fetch(apiBase ? `${apiBase}${path}` : withBasePath(path), {
            method: "POST",
            keepalive: true,
            credentials: "include",
        }).catch(() => {});
    }, [newsId, kind]);

    return null;
}
