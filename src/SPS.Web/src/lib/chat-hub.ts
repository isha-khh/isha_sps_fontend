import * as signalR from "@microsoft/signalr";
import { clientApiBaseUrl } from "@/lib/api-client";
import type { MessageDto } from "@/types/member-chat";

export type ChatHubState = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface ChatHubHandlers {
  /** 對話裡有新訊息（包含自己送出的回音，呼叫端要用訊息 Id 去重） */
  onMessage: (message: MessageDto) => void;
  /** 對方正在輸入 */
  onTyping: (chatRecordId: number, senderType: "member" | "admin") => void;
  /** 對話的狀態有變動（客服領取、離開、對方已讀、新對話），呼叫端重新載入對話列表即可 */
  onChatChanged: () => void;
  onStateChange: (state: ChatHubState) => void;
}

const RETRY_DELAYS_MS = [0, 2000, 5000, 10000, 30000];
const INITIAL_RETRY_MS = 15000;

/**
 * 會員與客服對話的即時連線（SignalR，`/hubs/member`，用登入的 cookie 驗證）。**只用來接收**客服的訊息、正在輸入與狀態變動；
 * 送訊息、回報輸入、標已讀仍走 HTTP（`memberChatApi`），那邊有字數與頻率限制，而且即使即時連線斷了也能送出。
 * 傳輸方式由 SignalR 自動協商：WebSocket 不通時會退成 Server-Sent Events 或長輪詢。第一次連不上會每 15 秒重試，
 * 連上之後斷線由 SignalR 自動重連；連線狀態透過 `onStateChange` 回報，呼叫端據此決定要不要用輪詢當備援。
 * 回傳的函式用來關閉連線（元件卸載時呼叫）。
 */
export function connectChatHub(handlers: ChatHubHandlers): () => void {
  let stopped = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${clientApiBaseUrl}/hubs/member`, { withCredentials: true })
    .withAutomaticReconnect(RETRY_DELAYS_MS)
    // 連不上時由輪詢備援，不需要在使用者的 console 刷錯誤；連線狀態由 onStateChange 回報
    .configureLogging(signalR.LogLevel.None)
    .build();

  connection.on("ReceiveMessage", (message: MessageDto) => handlers.onMessage(message));
  connection.on("UserTyping", (event: { chatRecordId: number; senderType: "member" | "admin" }) => handlers.onTyping(event.chatRecordId, event.senderType));
  for (const name of ["MessagesRead", "ChatCreated", "ChatClaimed", "ChatLeft"]) {
    connection.on(name, () => handlers.onChatChanged());
  }

  connection.onreconnecting(() => handlers.onStateChange("reconnecting"));
  connection.onreconnected(() => handlers.onStateChange("connected"));
  connection.onclose(() => {
    if (!stopped) handlers.onStateChange("disconnected");
  });

  const start = () => {
    if (stopped) return;
    handlers.onStateChange("connecting");
    connection
      .start()
      .then(() => {
        if (stopped) void connection.stop();
        else handlers.onStateChange("connected");
      })
      .catch(() => {
        // 第一次就連不上（例如代理不通、尚未登入）：維持輪詢備援，過一陣子再試
        if (stopped) return;
        handlers.onStateChange("disconnected");
        retryTimer = setTimeout(start, INITIAL_RETRY_MS);
      });
  };
  start();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    void connection.stop().catch(() => {});
  };
}
