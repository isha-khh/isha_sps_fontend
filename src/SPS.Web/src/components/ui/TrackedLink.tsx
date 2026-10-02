"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { withBasePath } from "@/lib/api-client";

/**
 * 積木元件：會記錄點擊次數的 Banner 連結。
 *
 * 後台「橫幅管理」會顯示每個 Banner 的點擊次數（`POST /api/Banner/{id}/click`），前台以前
 * 完全沒呼叫過這支 API，數字永遠是 0。點擊時送出記錄（失敗就吞掉）——不能 `await`、也不能
 * `preventDefault`，記錄失敗或太慢都不該影響使用者跳轉。
 *
 * 刻意不用 `apiClient`（axios）：它送 POST 前會先 `await` 抓一次 CSRF token，點的是會整頁跳轉
 * 的連結時，請求還沒送出頁面就已經卸載了；這支端點是匿名、不需要 CSRF token 的計數 API，
 * 直接用 `fetch(..., { keepalive: true })` 才能在頁面跳轉時照樣送完。網址組法跟 `apiClient` 一致
 * （優先 `NEXT_PUBLIC_API_BASE`，沒設就走同源＋站台 basePath）。
 *
 * 站內路徑（`/` 開頭、不開新視窗）用 `next/link` 保留前端換頁；外部網址或要開新視窗的用一般 `<a>`。
 */
export default function TrackedLink({
    bannerId,
    href,
    target,
    title,
    className,
    children,
}: {
    bannerId: number;
    href: string;
    target?: "_blank" | "_self";
    title?: string;
    className?: string;
    children: ReactNode;
}) {
    const track = () => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");
        const path = `/api/Banner/${bannerId}/click`;
        fetch(apiBase ? `${apiBase}${path}` : withBasePath(path), {
            method: "POST",
            keepalive: true,
            credentials: "include",
        }).catch(() => {});
    };

    const isInternal = href.startsWith("/") && target !== "_blank";
    if (isInternal) {
        return (
            <Link href={href} title={title} className={className} onClick={track}>
                {children}
            </Link>
        );
    }

    const isNewWindow = target === "_blank";
    return (
        <a
            href={href.startsWith("/") ? withBasePath(href) : href}
            title={title}
            className={className}
            target={isNewWindow ? "_blank" : undefined}
            rel={isNewWindow ? "noopener noreferrer" : undefined}
            onClick={track}
        >
            {children}
        </a>
    );
}
