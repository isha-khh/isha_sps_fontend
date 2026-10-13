"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiClient, withBasePath } from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/content-list-utils";

/** 後端 `PopupFrequency` */
const Frequency = { Always: 0, OncePerSession: 1, OncePerDay: 2, OnceOnly: 3 } as const;

interface PopupAnnouncement {
  id: number;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkTarget?: string | null;
  frequency: number;
  showCloseButton: boolean;
  showDontShowToday: boolean;
}

const todayKey = () => new Date().toDateString();

function readStorage(kind: "session" | "local", key: string): string | null {
  try {
    return (kind === "session" ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null; // 無痕模式或瀏覽器擋掉儲存空間時，當作沒看過，照常彈出
  }
}

function writeStorage(kind: "session" | "local", key: string, value: string) {
  try {
    (kind === "session" ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    // 存不進去就算了，頂多使用者下次還是會再看到
  }
}

/** 這則彈窗目前要不要顯示：使用者勾過「今天不再顯示」，或依顯示頻率已經看過就不顯示 */
function shouldShow(popup: PopupAnnouncement): boolean {
  if (readStorage("local", `sps-popup-hide-today-${popup.id}`) === todayKey()) return false;
  switch (popup.frequency) {
    case Frequency.OncePerSession:
      return readStorage("session", `sps-popup-session-${popup.id}`) === null;
    case Frequency.OncePerDay:
      return readStorage("local", `sps-popup-day-${popup.id}`) !== todayKey();
    case Frequency.OnceOnly:
      return readStorage("local", `sps-popup-once-${popup.id}`) === null;
    default:
      return true;
  }
}

/** 顯示的當下就記下「看過了」（依顯示頻率），使用者怎麼關掉都一樣 */
function markShown(popup: PopupAnnouncement) {
  switch (popup.frequency) {
    case Frequency.OncePerSession:
      return writeStorage("session", `sps-popup-session-${popup.id}`, "1");
    case Frequency.OncePerDay:
      return writeStorage("local", `sps-popup-day-${popup.id}`, todayKey());
    case Frequency.OnceOnly:
      return writeStorage("local", `sps-popup-once-${popup.id}`, "1");
  }
}

/** 連結只接受 http／https 或站內路徑（後端也檢查過，這裡再擋一次）；站內路徑要補上網站的 basePath */
function resolveLink(link?: string | null): string | undefined {
  const url = link?.trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return withBasePath(url);
  return undefined;
}

/**
 * 進站彈跳公告：資料來自後台「內容管理 → 彈窗公告」。依目前頁面路徑向後端要「適用路由包含這一頁、已發布、
 * 在生效期間內」的彈窗（後端已依優先順序由大到小排好），依序一則一則顯示（關掉一則才出現下一則）。
 *
 * 顯示頻率：每次顯示／每個瀏覽 Session 一次（sessionStorage）／每天一次與只顯示一次（localStorage）；
 * 彈窗有開「今日不再顯示」時，使用者勾選後當天（本機日期）任何頻率都不再出現。
 * 儲存空間用不了時（無痕模式）當作沒看過、照常彈出。取不到資料（後端連不到）就什麼都不彈，不影響頁面。
 * 內容是純文字（保留換行），不渲染 HTML。
 */
export default function PopupAnnouncements() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<PopupAnnouncement[]>([]);
  const [dontShowToday, setDontShowToday] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 換頁就重新要這一頁的彈窗
  useEffect(() => {
    let cancelled = false;
    const route = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    apiClient
      .get<PopupAnnouncement[]>("/api/popup-announcements/active", { params: { route } })
      .then((response) => {
        if (cancelled) return;
        const eligible = (Array.isArray(response.data) ? response.data : []).filter(shouldShow);
        setDontShowToday(false);
        setQueue(eligible);
      })
      .catch(() => {
        if (!cancelled) setQueue([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current = queue[0];

  // 目前這則一出現就記下「看過了」，並把焦點放到關閉按鈕
  useEffect(() => {
    if (!current) return;
    markShown(current);
    closeButtonRef.current?.focus();
  }, [current]);

  const close = () => {
    if (!current) return;
    if (current.showDontShowToday && dontShowToday) writeStorage("local", `sps-popup-hide-today-${current.id}`, todayKey());
    setDontShowToday(false);
    setQueue((prev) => prev.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, dontShowToday]);

  if (!current) return null;

  const imageUrl = resolveBackendAssetUrl(current.imageUrl);
  const link = resolveLink(current.linkUrl);
  const linkProps = link ? { href: link, target: current.linkTarget === "_self" ? "_self" : "_blank", rel: "noopener noreferrer" } : null;
  const image = imageUrl && <img className="img-fluid d-block" src={imageUrl} alt={current.title} style={{ width: "100%", height: "auto" }} />;

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0, 0, 0, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
        style={{ position: "relative", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.35)" }}
      >
        {current.showCloseButton && (
          <button
            type="button"
            ref={closeButtonRef}
            onClick={close}
            aria-label="關閉彈窗公告"
            style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 1, width: "2.25rem", height: "2.25rem", border: 0, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "1.25rem", lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </button>
        )}

        {image && (linkProps ? <a {...linkProps} title={`前往：${current.title}`}>{image}</a> : image)}

        {(current.content || !imageUrl || (linkProps && !imageUrl)) && (
          <div style={{ padding: "1.25rem 1.5rem" }}>
            {!imageUrl && <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.25rem" }}>{current.title}</h3>}
            {current.content && <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{current.content}</p>}
            {linkProps && !imageUrl && (
              <a {...linkProps} className="more_x more_x_gu mt-3 d-inline-flex">
                <span>了解更多</span>
              </a>
            )}
          </div>
        )}

        {current.showDontShowToday && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5em", padding: "0.75em 1.5em", background: "#f3f3f3", borderTop: "1px solid #e2e2e2" }}>
            <input type="checkbox" id="popup-dont-show-today" checked={dontShowToday} onChange={(event) => setDontShowToday(event.target.checked)} />
            <label htmlFor="popup-dont-show-today" style={{ margin: 0 }}>
              今天不再顯示
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
