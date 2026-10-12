"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { memberNotificationsApi, type MemberNotification, type MemberNotificationType } from "@/lib/api/member-notifications";
import { getApiErrorMessage } from "@/lib/error-utils";

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<MemberNotificationType, string> = {
  ReplyReviewed: "回應審核",
  ReplyReceived: "收到的回應",
  DemandMatched: "需求媒合",
  InquiryReplied: "客服回覆",
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("zh-TW", { hour12: false });
}

/**
 * 積木元件：會員中心「收件匣」面板——系統寄給會員的站內通知：供應業者的回應審核結果、需求業者收到的回應、
 * 符合專長的新需求、客服對詢問單的回覆。與寄信並行（信件照寄），這裡不會有會員之間或與客服的對話（之後另做）。
 * 接 `GET /api/member/notifications`；點開一則就標成已讀，頁首的未讀數會跟著更新。內文是純文字，不當 HTML 輸出。
 */
export default function InboxPanel() {
  const [items, setItems] = useState<MemberNotification[]>();
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // 換篩選條件（只看未讀）時重新載入第一頁
  useEffect(() => {
    let active = true;
    memberNotificationsApi
      .getList({ unreadOnly, page: 1, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setTotalCount(data.totalCount);
        setUnreadCount(data.unreadCount);
        setPage(1);
        setError(undefined);
      })
      .catch((err) => active && setError(getApiErrorMessage(err, "載入收件匣失敗")));
    return () => {
      active = false;
    };
  }, [unreadOnly]);

  const loadMore = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await memberNotificationsApi.getList({ unreadOnly, page: page + 1, pageSize: PAGE_SIZE });
      setItems((prev) => [...(prev ?? []), ...data.items]);
      setPage(page + 1);
      setTotalCount(data.totalCount);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(getApiErrorMessage(err, "載入失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }, [busy, page, unreadOnly]);

  async function toggle(item: MemberNotification) {
    const opening = openId !== item.id;
    setOpenId(opening ? item.id : null);
    if (opening && !item.isRead) {
      try {
        await memberNotificationsApi.markRead(item.id);
        setItems((prev) => prev?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // 標已讀失敗不影響閱讀，下次開啟會再試
      }
    }
  }

  async function markAllRead() {
    if (busy) return;
    setBusy(true);
    try {
      await memberNotificationsApi.markAllRead();
      setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(getApiErrorMessage(err, "操作失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  if (!items && !error) return <p className="text-muted">載入中…</p>;

  return (
    <div>
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      {items && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <span>
              未讀 <strong>{unreadCount}</strong> 則
            </span>
            <div className="d-flex align-items-center gap-3">
              <label className="mb-0">
                <input type="checkbox" className="form-check-input me-1" checked={unreadOnly} onChange={() => setUnreadOnly((prev) => !prev)} />
                只看未讀
              </label>
              <button type="button" className="tier-reset-btn" disabled={busy || unreadCount === 0} onClick={() => void markAllRead()}>
                全部標為已讀
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-muted">{unreadOnly ? "沒有未讀的通知。" : "還沒有通知。回應審核結果、收到的回應、符合專長的新需求與客服回覆，都會出現在這裡。"}</p>
          ) : (
            <div className="d-grid gap-2">
              {items.map((item) => (
                <div key={item.id} className="border rounded p-3" style={item.isRead ? undefined : { borderColor: "#0052cc", background: "#f3f8ff" }}>
                  <button
                    type="button"
                    className="w-100 text-start d-flex justify-content-between align-items-start gap-3"
                    style={{ background: "none", border: 0, padding: 0 }}
                    aria-expanded={openId === item.id}
                    onClick={() => void toggle(item)}
                  >
                    <span>
                      {!item.isRead && <span className="me-2" style={{ color: "#c0392b" }} aria-label="未讀">●</span>}
                      <span className="badge-tag me-2">{TYPE_LABEL[item.type] ?? "通知"}</span>
                      <strong>{item.title}</strong>
                    </span>
                    <span className="small text-muted text-nowrap">{formatDateTime(item.createdTime)}</span>
                  </button>

                  {openId === item.id && (
                    <div className="mt-3">
                      {item.content && (
                        <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </p>
                      )}
                      {item.linkPath && (
                        <Link href={item.linkPath} className="blue">
                          前往查看 <i className="bi bi-arrow-right" aria-hidden="true"></i>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {items.length < totalCount && (
            <div className="text-center mt-3">
              <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void loadMore()}>
                {busy ? "載入中…" : "載入更多"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
