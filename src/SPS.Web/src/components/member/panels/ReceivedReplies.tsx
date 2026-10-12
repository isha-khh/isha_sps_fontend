"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { memberFavoritesApi, type ReceivedReply } from "@/lib/api/member-favorites";
import { memberChatApi } from "@/lib/api/member-chat";
import { getApiErrorMessage } from "@/lib/error-utils";

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("zh-TW");
}

/**
 * 積木元件：「媒合資料維護」裡，自己刊登並已上架的需求收到的回應（供應業者的回應經後台審核通過才會出現在這裡），
 * 可以對回應者「傳訊息」：開啟一個綁定這則回應的對話（接 `POST /api/member-chat/demand-reply/{replyId}`），然後前往「客服訊息」分頁的對話。
 * 只有刊登這筆需求的會員看得到；展開時才載入。
 */
export default function ReceivedReplies({ demandId }: { demandId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ReceivedReply[]>();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !replies) {
      setLoading(true);
      setError(undefined);
      try {
        setReplies(await memberFavoritesApi.getReceivedReplies(demandId));
      } catch (err) {
        setError(getApiErrorMessage(err, "載入收到的回應失敗"));
      } finally {
        setLoading(false);
      }
    }
  }

  async function openChat(reply: ReceivedReply) {
    if (busyId != null) return;
    if (reply.chatRecordId) {
      router.push(`/member?section=chat&chat=${reply.chatRecordId}`);
      return;
    }
    setBusyId(reply.replyId);
    setError(undefined);
    try {
      const chat = await memberChatApi.openDemandChat(reply.replyId);
      router.push(`/member?section=chat&chat=${chat.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "無法開啟對話，請稍後再試"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-2">
      <button type="button" className="tier-reset-btn" onClick={() => void toggle()} aria-expanded={open}>
        {open ? "收合收到的回應" : "查看收到的回應"}
      </button>

      {open && (
        <div className="mt-2">
          {loading && <p className="text-muted mb-0">載入中…</p>}
          {error && (
            <p className="text-danger mb-2" role="alert">
              {error}
            </p>
          )}
          {replies && replies.length === 0 && <p className="text-muted mb-0">還沒有審核通過的回應。供應業者的回應經平台審核通過後，會出現在這裡，也會寄到您的信箱與收件匣。</p>}
          {replies && replies.length > 0 && (
            <div className="d-grid gap-2">
              {replies.map((reply) => (
                <div key={reply.replyId} className="border rounded p-3" style={{ background: "#f7f9fc" }}>
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <strong>{reply.companyName || "供應業者"}</strong>
                      <div className="small text-muted">
                        {reply.contactName}　{reply.contactEmail}
                        {reply.contactPhone ? `　${reply.contactPhone}` : ""}　{formatDate(reply.receivedTime)}
                      </div>
                    </div>
                    <button type="button" className="tier-submit-btn" disabled={busyId === reply.replyId} onClick={() => void openChat(reply)}>
                      {reply.chatRecordId ? "前往對話" : busyId === reply.replyId ? "開啟中…" : "傳訊息"}
                    </button>
                  </div>
                  <p className="mt-2 mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
