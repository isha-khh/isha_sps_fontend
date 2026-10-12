"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { memberChatApi } from "@/lib/api/member-chat";
import { connectChatHub, type ChatHubState } from "@/lib/chat-hub";
import { getApiErrorMessage } from "@/lib/error-utils";
import { useAuthStore } from "@/store/auth-store";
import type { ChatRecordDto, MessageDto } from "@/types/member-chat";

const MAX_LENGTH = 1000;
// 即時連線（SignalR）連著的時候輪詢只當保險（補漏掉的事件）；沒連上時輪詢就是主要的更新方式
const LIST_POLL_MS = 15000;
const MESSAGE_POLL_MS = 5000;
const TYPING_POLL_MS = 2500;
const LIST_POLL_CONNECTED_MS = 60000;
const MESSAGE_POLL_CONNECTED_MS = 30000;
const TYPING_REPORT_MS = 3000;
const TYPING_SHOW_MS = 5000;

const STATUS_WAITING = 0;
const STATUS_CLOSED = 2;
const TYPE_MEMBER = 1;
const TYPE_CUSTOMER_SERVICE = 2;

const REPORT_REASONS = [
  { value: 1, label: "騷擾或不當言論" },
  { value: 2, label: "廣告或垃圾訊息" },
  { value: 3, label: "詐騙或可疑" },
  { value: 4, label: "其他" },
];

function formatTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("zh-TW", { hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function activityTime(chat: ChatRecordDto) {
  return chat.lastMessage?.createdTime ?? chat.createdTime;
}

/** 會員之間的對話：對方的名稱（公司加姓名）；客服對話：「平台客服」 */
function chatTitle(chat: ChatRecordDto, myId?: string) {
  if (chat.type === TYPE_CUSTOMER_SERVICE) return "平台客服";
  const iAmInitiator = chat.initiatorMemberId === myId;
  const name = (iAmInitiator ? chat.targetMemberName : chat.initiatorMemberName) ?? "會員";
  const company = iAmInitiator ? chat.targetCompanyName : chat.initiatorCompanyName;
  return company ? `${company} ${name}` : name;
}

function statusText(chat: ChatRecordDto) {
  if (chat.status === STATUS_CLOSED) return "對話已結束";
  if (chat.type === TYPE_MEMBER) return chat.demandName ? `需求：${chat.demandName}` : "會員對話";
  if (chat.status === STATUS_WAITING) return "等待客服接手";
  return chat.agentName ? `由 ${chat.agentName} 為您服務` : "客服服務中";
}

/** 這個對話目前能不能傳訊息，不能的話回傳要顯示的原因 */
function sendBlockedReason(chat: ChatRecordDto): string | null {
  if (chat.status === STATUS_CLOSED) return chat.type === TYPE_CUSTOMER_SERVICE ? "這個對話已經結束。如果還有問題，請按「聯絡客服」。" : "這個對話已經結束，無法再傳送訊息。";
  if (chat.type === TYPE_MEMBER && chat.sendBlocked) return chat.blockedByMe ? "您已封鎖對方，解除封鎖後才能傳送訊息。" : "目前無法傳送訊息給對方。";
  return null;
}

/**
 * 積木元件：會員中心「客服訊息」面板——會員與平台客服的對話，以及會員之間針對「審核通過的需求回應」的對話。
 * 客服對話：按「聯絡客服」建立等待中的對話並通知客服（已經有進行中的就直接打開），客服在後台領取後回覆，也可以先留言。
 * 會員之間的對話：只能由需求刊登者從「媒合資料維護」收到的回應開啟，綁定那筆需求；任一方可以封鎖對方（雙方都不能再傳訊息、可解除）
 * 或檢舉對話（平常平台看不到會員之間的對話內容，只有被檢舉的才開放給承辦人員審閱）。
 * 傳訊息、回報輸入、標已讀、封鎖與檢舉走 HTTP；**接收**用即時連線（SignalR，見 `lib/chat-hub.ts`），對方的回覆與「正在輸入」立刻出現。
 * 即時連線沒連上（代理不通、斷線重連中）時自動退回輪詢當備援（對話打開時每 5 秒、輸入提示每 2.5 秒、對話列表每 15 秒，分頁在背景時暫停），
 * 連上之後輪詢放慢成保險。對方傳來的訊息打開後會自動標為已讀（頁首的未讀數跟著更新）。訊息內容是純文字，不當 HTML 輸出。
 * 網址 `?section=chat&chat=123` 可以直接打開指定的對話（通知裡的連結用）。
 */
export default function ChatPanel() {
  const myId = useAuthStore((state) => state.member?.id);
  const paramChatId = Number(useSearchParams().get("chat")) || null;

  const [chats, setChats] = useState<ChatRecordDto[]>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<{ chatId: number; items: MessageDto[] } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  // 對方是不是正在輸入：記下是哪個對話，換對話時不會殘留
  const [peerTypingChatId, setPeerTypingChatId] = useState<number | null>(null);
  const [hubState, setHubState] = useState<ChatHubState>("connecting");
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState(1);
  const [reportDetail, setReportDetail] = useState("");
  const connected = hubState === "connected";
  const lastTypingReportRef = useRef(0);
  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 最近有動靜的對話在前
  const sortedChats = [...(chats ?? [])].sort((a, b) => (activityTime(a) < activityTime(b) ? 1 : -1));
  const currentId = selectedId ?? (paramChatId && sortedChats.some((chat) => chat.id === paramChatId) ? paramChatId : null) ?? sortedChats[0]?.id ?? null;
  const current = sortedChats.find((chat) => chat.id === currentId);
  const blockedReason = current ? sendBlockedReason(current) : null;
  const canSend = current != null && blockedReason == null;
  const pollable = current != null && current.status !== STATUS_CLOSED;
  const hasOpenCustomerServiceChat = sortedChats.some((chat) => chat.type === TYPE_CUSTOMER_SERVICE && chat.status !== STATUS_CLOSED);
  const messages = thread && thread.chatId === currentId ? thread.items : [];

  const loadChats = useCallback(() => {
    memberChatApi
      .getChats()
      .then((data) => {
        setChats(data);
        setError(undefined);
      })
      .catch((err) => setError(getApiErrorMessage(err, "載入對話失敗")));
  }, []);

  // 對話列表：載入一次，之後定時更新（狀態變化、未讀數）；即時連線連著時放慢
  useEffect(() => {
    loadChats();
    const timer = window.setInterval(loadChats, connected ? LIST_POLL_CONNECTED_MS : LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadChats, connected]);

  const loadMessages = useCallback((chatId: number) => {
    if (document.hidden) return;
    memberChatApi
      .getMessages(chatId)
      .then((items) => {
        setThread({ chatId, items });
        const myIdNow = useAuthStore.getState().member?.id;
        // 對方傳來還沒讀的訊息標為已讀（客服訊息的 senderType 是 admin；會員之間用傳送者是不是我判斷）
        if (items.some((m) => !m.isRead && (m.senderType === "admin" || (m.senderMemberId != null && m.senderMemberId !== myIdNow)))) void memberChatApi.markRead(chatId).catch(() => {});
      })
      .catch(() => {});
  }, []);

  // 目前對話的訊息：載入一次，之後定時更新（即時連線連著時放慢，只當保險）
  useEffect(() => {
    if (currentId == null) return;
    loadMessages(currentId);
    const timer = window.setInterval(() => loadMessages(currentId), connected ? MESSAGE_POLL_CONNECTED_MS : MESSAGE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [currentId, connected, loadMessages]);

  // 即時連線：收到對方的訊息、正在輸入與對話狀態變動。處理函式要用到最新的 currentId，所以放在 ref 裡，連線本身只建立一次
  const latestRef = useRef({ currentId, loadChats, loadMessages });
  useEffect(() => {
    latestRef.current = { currentId, loadChats, loadMessages };
  });
  useEffect(() => {
    const disconnect = connectChatHub({
      onStateChange: (state) => {
        setHubState(state);
        // 連上（或重連）後重新載入一次，補上斷線期間漏掉的
        if (state === "connected") {
          latestRef.current.loadChats();
          if (latestRef.current.currentId != null) latestRef.current.loadMessages(latestRef.current.currentId);
        }
      },
      onMessage: (message) => {
        const { currentId: openId, loadChats: reloadChats } = latestRef.current;
        if (message.chatRecordId === openId) {
          // 自己送出的訊息也會回音一次，用訊息 Id 去重
          setThread((prev) => (prev && prev.chatId === openId && !prev.items.some((m) => m.id === message.id) ? { chatId: openId, items: [...prev.items, message] } : prev));
          if (!document.hidden && message.senderMemberId !== useAuthStore.getState().member?.id) void memberChatApi.markRead(openId).catch(() => {});
        }
        setPeerTypingChatId((prev) => (prev === message.chatRecordId ? null : prev));
        reloadChats();
      },
      // 伺服器只會把「對方」輸入的事件傳給我（不會傳回給輸入的人自己）
      onTyping: (chatRecordId) => {
        setPeerTypingChatId(chatRecordId);
        clearTimeout(typingClearTimerRef.current);
        typingClearTimerRef.current = setTimeout(() => setPeerTypingChatId((prev) => (prev === chatRecordId ? null : prev)), TYPING_SHOW_MS);
      },
      onChatChanged: () => latestRef.current.loadChats(),
    });
    return () => {
      disconnect();
      clearTimeout(typingClearTimerRef.current);
    };
  }, []);

  // 對方正在輸入：即時連線沒連上時，對話還在進行中就每 2.5 秒問一次（分頁在背景時暫停）；連上時由即時事件通知，不用問
  useEffect(() => {
    if (currentId == null || !pollable || connected) return;
    let active = true;
    const load = () => {
      if (document.hidden) return;
      memberChatApi
        .getPeerTyping(currentId)
        .then((typing) => active && setPeerTypingChatId(typing ? currentId : null))
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, TYPING_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentId, pollable, connected]);

  // 有新訊息就捲到最底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, currentId]);

  async function startCustomerServiceChat() {
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
    if (busy || !content || currentId == null || !canSend) return;
    setBusy(true);
    setError(undefined);
    try {
      const message = await memberChatApi.sendMessage(currentId, content);
      setThread((prev) => {
        const existing = prev && prev.chatId === currentId ? prev.items : [];
        // 即時連線可能已經先把這則訊息的回音加進來了
        return { chatId: currentId, items: existing.some((m) => m.id === message.id) ? existing : [...existing, message] };
      });
      setText("");
    } catch (err) {
      setError(getApiErrorMessage(err, "傳送失敗，請稍後再試"));
      loadChats();
    } finally {
      setBusy(false);
    }
  }

  // 輸入時回報給對方（每 3 秒最多一次）
  function onTextChange(value: string) {
    setText(value);
    if (!value.trim() || currentId == null || !canSend) return;
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

  async function toggleBlock() {
    if (!current || busy) return;
    if (!current.blockedByMe && !window.confirm("封鎖對方後，雙方都不能再在這個對話傳訊息（已有的訊息會保留），之後可以解除封鎖。確定要封鎖嗎？")) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await (current.blockedByMe ? memberChatApi.unblock(current.id) : memberChatApi.block(current.id));
      loadChats();
    } catch (err) {
      setError(getApiErrorMessage(err, "操作失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!current || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await memberChatApi.report(current.id, { reason: reportReason, detail: reportDetail.trim() || undefined });
      setReporting(false);
      setReportDetail("");
      setNotice("已收到您的檢舉，承辦人員會審閱這個對話。");
    } catch (err) {
      setError(getApiErrorMessage(err, "檢舉失敗，請稍後再試"));
    } finally {
      setBusy(false);
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
      {notice && (
        <p className="text-success" role="status">
          {notice}
        </p>
      )}

      {chats && sortedChats.length === 0 && (
        <div>
          <p>有問題想詢問平台客服嗎？按下「聯絡客服」會通知客服，客服接手後會在這裡回覆您，也可以先留言。</p>
          <p className="small text-muted">需求刊登者也可以到「媒合資料維護」，對審核通過的回應者開啟對話，對話會出現在這裡。</p>
          <button type="button" className="tier-submit-btn" disabled={busy} onClick={() => void startCustomerServiceChat()}>
            {busy ? "處理中…" : "聯絡客服"}
          </button>
        </div>
      )}

      {chats && sortedChats.length > 0 && (
        <div className="d-flex flex-wrap gap-3">
          <div style={{ flex: "0 0 240px", minWidth: 200 }}>
            <div className="d-grid gap-2 mb-2">
              {sortedChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="text-start border rounded p-2"
                  style={{ background: chat.id === currentId ? "#eaf2ff" : "#fff", borderColor: chat.id === currentId ? "#0052cc" : undefined }}
                  onClick={() => {
                    setSelectedId(chat.id);
                    setReporting(false);
                    setNotice(undefined);
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <strong className="small">{chatTitle(chat, myId)}</strong>
                    {chat.unreadCount > 0 && <span className="badge rounded-pill bg-danger">{chat.unreadCount}</span>}
                  </div>
                  <div className="small text-muted">{statusText(chat)}</div>
                  {chat.lastMessage?.text && (
                    <div className="small text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.lastMessage.text}
                    </div>
                  )}
                </button>
              ))}
            </div>
            {!hasOpenCustomerServiceChat && (
              <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void startCustomerServiceChat()}>
                聯絡客服
              </button>
            )}
          </div>

          {current && (
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <strong>{chatTitle(current, myId)}</strong>
                  <span className="badge-tag ms-2">{statusText(current)}</span>
                </div>
                {current.type === TYPE_MEMBER && (
                  <div className="d-flex gap-2">
                    <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => void toggleBlock()}>
                      {current.blockedByMe ? "解除封鎖" : "封鎖"}
                    </button>
                    <button type="button" className="tier-reset-btn" disabled={busy} onClick={() => setReporting((prev) => !prev)}>
                      檢舉
                    </button>
                  </div>
                )}
              </div>

              {reporting && (
                <div className="border rounded p-3 mb-3" style={{ background: "#fff8f0" }}>
                  <p className="small mb-2">檢舉後，承辦人員會審閱這個對話的內容（平常平台看不到會員之間的對話）。</p>
                  <select className="form-select form-select-sm mb-2" value={reportReason} onChange={(event) => setReportReason(Number(event.target.value))} aria-label="檢舉原因">
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  <textarea className="form-control mb-2" rows={2} maxLength={1000} placeholder="補充說明（選填）" value={reportDetail} onChange={(event) => setReportDetail(event.target.value)} aria-label="檢舉說明" />
                  <div className="d-flex gap-2">
                    <button type="button" className="tier-submit-btn" disabled={busy} onClick={() => void submitReport()}>
                      送出檢舉
                    </button>
                    <button type="button" className="tier-reset-btn" onClick={() => setReporting(false)}>
                      取消
                    </button>
                  </div>
                </div>
              )}

              <div ref={scrollRef} className="border rounded p-3 mb-3" style={{ height: 360, overflowY: "auto", background: "#f7f9fc" }} aria-live="polite">
                {messages.length === 0 ? (
                  <p className="text-muted mb-0">{canSend ? "還沒有訊息，請在下方輸入。" : "這個對話沒有訊息。"}</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderType === "member" && message.senderMemberId === myId;
                    return (
                      <div key={message.id} className={`d-flex mb-3 ${mine ? "justify-content-end" : "justify-content-start"}`}>
                        <div style={{ maxWidth: "75%" }}>
                          <div className="small text-muted mb-1" style={{ textAlign: mine ? "right" : "left" }}>
                            {mine ? "我" : message.senderUserName || message.senderMemberName || "對方"}　{formatTime(message.createdTime)}
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

              {pollable && peerTypingChatId === currentId && (
                <p className="small text-muted mb-2" aria-live="polite">
                  <i className="bi bi-three-dots me-1" aria-hidden="true"></i>
                  {current.type === TYPE_CUSTOMER_SERVICE ? "客服" : "對方"}正在輸入…
                </p>
              )}

              {current.type === TYPE_CUSTOMER_SERVICE && current.status === STATUS_WAITING && <p className="small text-muted">已通知客服，客服接手後會在這裡回覆，您也可以先留言。這個頁面會自動更新，不需要重新整理。</p>}

              {canSend ? (
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
                <p className="text-muted">{blockedReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
