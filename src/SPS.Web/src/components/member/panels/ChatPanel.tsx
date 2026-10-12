"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { memberChatApi } from "@/lib/api/member-chat";
import { getApiErrorMessage } from "@/lib/error-utils";
import type { ChatRecordDto, MessageDto } from "@/types/member-chat";

const MAX_LENGTH = 1000;
const LIST_POLL_MS = 15000;
const MESSAGE_POLL_MS = 5000;
const TYPING_POLL_MS = 2500;
const TYPING_REPORT_MS = 3000;

const STATUS_WAITING = 0;
const STATUS_CLOSED = 2;

function formatTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("zh-TW", { hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusText(chat: ChatRecordDto) {
  if (chat.status === STATUS_CLOSED) return "對話已結束";
  if (chat.status === STATUS_WAITING) return "等待客服接手";
  return chat.agentName ? `由 ${chat.agentName} 為您服務` : "客服服務中";
}

/**
 * 積木元件：會員中心「客服訊息」面板——會員與平台客服的對話（`api/member-chat`，會員之間的對話目前不開放）。
 * 按「聯絡客服」會建立一個等待中的對話並通知客服（已經有進行中的就直接打開），客服在後台領取後開始回覆；也可以先留言。
 * 前台用 HTTP 傳訊息、輪詢更新（對話打開時每 5 秒、分頁在背景時暫停；對話列表每 15 秒），不依賴即時連線，
 * 所以延遲最多幾秒。客服傳來的訊息打開後會自動標為已讀（頁首的未讀數跟著更新）。訊息內容是純文字，不當 HTML 輸出。
 */
export default function ChatPanel() {
  const [chats, setChats] = useState<ChatRecordDto[]>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<{ chatId: number; items: MessageDto[] } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // 客服是不是正在輸入：記下是哪個對話，換對話時不會殘留
  const [agentTyping, setAgentTyping] = useState<number | null>(null);
  const lastTypingReportRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 只顯示會員與客服的對話，最新的在前
  const customerServiceChats = (chats ?? []).filter((chat) => chat.type === 2).sort((a, b) => (a.createdTime < b.createdTime ? 1 : -1));
  const currentId = selectedId ?? customerServiceChats[0]?.id ?? null;
  const current = customerServiceChats.find((chat) => chat.id === currentId);
  const isOpen = current != null && current.status !== STATUS_CLOSED;
  const hasOpenChat = customerServiceChats.some((chat) => chat.status !== STATUS_CLOSED);
  const messages = thread && thread.chatId === currentId ? thread.items : [];

  // 對話列表：載入一次，之後定時更新（狀態變化、未讀數）
  useEffect(() => {
    let active = true;
    const load = () => {
      memberChatApi
        .getChats()
        .then((data) => {
          if (!active) return;
          setChats(data);
          setError(undefined);
        })
        .catch((err) => active && setError(getApiErrorMessage(err, "載入客服對話失敗")));
    };
    load();
    const timer = window.setInterval(load, LIST_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  // 目前對話的訊息：載入一次，之後每 5 秒更新；客服傳來還沒讀的訊息標為已讀
  useEffect(() => {
    if (currentId == null) return;
    let active = true;
    const load = () => {
      if (document.hidden) return;
      memberChatApi
        .getMessages(currentId)
        .then((items) => {
          if (!active) return;
          setThread({ chatId: currentId, items });
          if (items.some((m) => m.senderType === "admin" && !m.isRead)) void memberChatApi.markRead(currentId).catch(() => {});
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, MESSAGE_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentId]);

  // 客服正在輸入：對話還在進行中時每 2.5 秒問一次（分頁在背景時暫停）
  useEffect(() => {
    if (currentId == null || !isOpen) return;
    let active = true;
    const load = () => {
      if (document.hidden) return;
      memberChatApi
        .getAgentTyping(currentId)
        .then((typing) => active && setAgentTyping(typing ? currentId : null))
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, TYPING_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentId, isOpen]);

  // 有新訊息就捲到最底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, currentId]);

  async function startChat() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const chat = await memberChatApi.createCustomerServiceChat();
      setChats(await memberChatApi.getChats());
      setSelectedId(chat.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "無法聯絡客服，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const content = text.trim();
    if (busy || !content || currentId == null || !isOpen) return;
    setBusy(true);
    setError(undefined);
    try {
      const message = await memberChatApi.sendMessage(currentId, content);
      setThread((prev) => ({ chatId: currentId, items: [...(prev && prev.chatId === currentId ? prev.items : []), message] }));
      setText("");
    } catch (err) {
      setError(getApiErrorMessage(err, "傳送失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  // 輸入時回報給客服（每 3 秒最多一次），客服那端會顯示「會員正在輸入」
  function onTextChange(value: string) {
    setText(value);
    if (!value.trim() || currentId == null || !isOpen) return;
    const now = Date.now();
    if (now - lastTypingReportRef.current < TYPING_REPORT_MS) return;
    lastTypingReportRef.current = now;
    void memberChatApi.sendTyping(currentId).catch(() => {});
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 送出，Shift+Enter 換行；輸入法選字中的 Enter 不送出
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  if (!chats && !error) return <p className="text-muted">載入中…</p>;

  return (
    <div>
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      {chats && customerServiceChats.length === 0 && (
        <div>
          <p>有問題想詢問平台客服嗎？按下「聯絡客服」會通知客服，客服接手後會在這裡回覆您，也可以先留言。</p>
          <button type="button" className="tier-submit-btn" disabled={busy} onClick={() => void startChat()}>
            {busy ? "處理中…" : "聯絡客服"}
          </button>
        </div>
      )}

      {current && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {customerServiceChats.length > 1 ? (
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={currentId ?? ""} onChange={(event) => setSelectedId(Number(event.target.value))} aria-label="選擇對話">
                  {customerServiceChats.map((chat) => (
                    <option key={chat.id} value={chat.id}>
                      {formatTime(chat.createdTime)} 的對話{chat.unreadCount > 0 ? `（${chat.unreadCount} 則未讀）` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>{formatTime(current.createdTime)} 的對話</strong>
              )}
              <span className="badge-tag">{statusText(current)}</span>
            </div>
            {!hasOpenChat && (
              <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void startChat()}>
                重新聯絡客服
              </button>
            )}
          </div>

          <div ref={scrollRef} className="border rounded p-3 mb-3" style={{ height: 360, overflowY: "auto", background: "#f7f9fc" }} aria-live="polite">
            {messages.length === 0 ? (
              <p className="text-muted mb-0">{isOpen ? "還沒有訊息，請在下方輸入您的問題。" : "這個對話沒有訊息。"}</p>
            ) : (
              messages.map((message) => {
                const mine = message.senderType === "member";
                return (
                  <div key={message.id} className={`d-flex mb-3 ${mine ? "justify-content-end" : "justify-content-start"}`}>
                    <div style={{ maxWidth: "75%" }}>
                      <div className="small text-muted mb-1" style={{ textAlign: mine ? "right" : "left" }}>
                        {mine ? "我" : message.senderUserName || "客服"}　{formatTime(message.createdTime)}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "8px 12px", borderRadius: 12, background: mine ? "#0052cc" : "#fff", color: mine ? "#fff" : "#1a1a1a", border: mine ? "none" : "1px solid #d9dee3" }}>
                        {message.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isOpen && agentTyping === currentId && (
            <p className="small text-muted mb-2" aria-live="polite">
              <i className="bi bi-three-dots me-1" aria-hidden="true"></i>
              客服正在輸入…
            </p>
          )}

          {current.status === STATUS_WAITING && <p className="small text-muted">已通知客服，客服接手後會在這裡回覆，您也可以先留言。這個頁面會自動更新，不需要重新整理。</p>}

          {isOpen ? (
            <div>
              <textarea
                className="form-control mb-2"
                rows={3}
                maxLength={MAX_LENGTH}
                placeholder="輸入訊息（Enter 送出，Shift+Enter 換行）"
                value={text}
                onChange={(event) => onTextChange(event.target.value)}
                onKeyDown={onKeyDown}
                aria-label="訊息內容"
              />
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">
                  {text.length} / {MAX_LENGTH}
                </span>
                <button type="button" className="tier-submit-btn" disabled={busy || !text.trim()} onClick={() => void send()}>
                  {busy ? "傳送中…" : "送出"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted">這個對話已經結束。如果還有問題，請按「重新聯絡客服」。</p>
          )}
        </>
      )}
    </div>
  );
}
