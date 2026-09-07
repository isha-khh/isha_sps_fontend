import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import type {
  // Visitor (CustomerHub)
  UserSession,
  ChatMessage,
  MessageReceivedEvent,
  UserConnectedEvent,
  UserDisconnectedEvent,
  UserActivityUpdatedEvent,
  ChatStatistics,
  // Member (MemberHub)
  ChatRecordDto,
  MessageDto,
  MessagesReadEvent,
  UserTypingEvent,
  SystemMessageEvent,
  ChatTab,
} from '@/types/chat';
import { chatApi } from '@/lib/api/chat';
import { memberChatApi } from '@/lib/api/member-chat';

// ==================== Store 介面 ====================

interface ChatStore {
  // ========== 共用狀態 ==========
  activeTab: ChatTab;
  isOpen: boolean;
  isLoading: boolean;

  // ========== 訪客客服（CustomerHub） ==========
  customerConnection: signalR.HubConnection | null;
  customerConnectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  onlineVisitors: UserSession[];
  activeSessionId: string | null;
  activeSession: UserSession | null;
  visitorMessages: Record<string, ChatMessage[]>;
  visitorUnreadCounts: Record<string, number>;
  visitorTotalUnread: number;
  statistics: ChatStatistics | null;
  agentId: string | null;
  agentName: string | null;
  agentAvatarUrl: string | null;

  // ========== 會員聊天（MemberHub） ==========
  memberConnection: signalR.HubConnection | null;
  memberConnectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  chatList: ChatRecordDto[];
  waitingChats: ChatRecordDto[];
  activeChatId: number | null;
  memberMessages: Record<number, MessageDto[]>;
  memberTotalUnread: number;
  typingIndicators: Record<number, string | null>;

  // ========== 計算屬性 ==========
  totalUnreadCount: number;

  // ========== 連接管理 ==========
  connect: (agentId: string, agentName: string, agentAvatarUrl?: string | null) => Promise<void>;
  disconnect: () => Promise<void>;

  // ========== 訪客操作 ==========
  fetchOnlineVisitors: () => Promise<void>;
  fetchVisitorSession: (sessionId: string) => Promise<void>;
  fetchChatHistory: (sessionId: string, skip?: number, limit?: number) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  fetchVisitorUnreadCount: (sessionId: string) => Promise<void>;
  sendVisitorMessage: (sessionId: string, message: string) => Promise<void>;
  setActiveSession: (sessionId: string | null) => Promise<void>;
  markVisitorMessageAsRead: (messageId: string) => Promise<void>;

  // ========== 會員操作 ==========
  fetchChatList: () => Promise<void>;
  fetchWaitingChats: () => Promise<void>;
  fetchMemberMessages: (chatRecordId: number, skip?: number, take?: number) => Promise<void>;
  fetchMemberUnreadCount: () => Promise<void>;
  sendMemberMessage: (chatRecordId: number, text: string) => Promise<void>;
  markMemberAsRead: (chatRecordId: number) => Promise<void>;
  sendTypingIndicator: (chatRecordId: number) => Promise<void>;
  setActiveChat: (chatRecordId: number | null) => Promise<void>;
  claimChat: (chatRecordId: number) => Promise<void>;
  leaveChat: (chatRecordId: number) => Promise<void>;

  // ========== UI ==========
  setActiveTab: (tab: ChatTab) => void;
  toggleChat: () => void;
  openChat: (sessionId?: string) => void;
  closeChat: () => void;
  setLoading: (isLoading: boolean) => void;
  updateTotalUnread: () => void;

  // ========== 內部 ==========
  _addVisitorMessage: (sessionId: string, message: ChatMessage) => void;
  _updateVisitorStatus: (sessionId: string, isOnline: boolean) => void;
  _updateVisitorActivity: (sessionId: string, url: string, title?: string) => void;
}

// 連線鎖，防止重複連線
let _isConnecting = false;

// ==================== Store 實現 ====================

export const useChatStore = create<ChatStore>((set, get) => ({
  // ========== 初始狀態 ==========
  activeTab: 'visitor',
  isOpen: false,
  isLoading: false,

  // 訪客
  customerConnection: null,
  customerConnectionState: 'disconnected',
  onlineVisitors: [],
  activeSessionId: null,
  activeSession: null,
  visitorMessages: {},
  visitorUnreadCounts: {},
  visitorTotalUnread: 0,
  statistics: null,
  agentId: null,
  agentName: null,
  agentAvatarUrl: null,

  // 會員
  memberConnection: null,
  memberConnectionState: 'disconnected',
  chatList: [],
  waitingChats: [],
  activeChatId: null,
  memberMessages: {},
  memberTotalUnread: 0,
  typingIndicators: {},

  totalUnreadCount: 0,

  // ==================== 連接管理 ====================

  connect: async (agentId: string, agentName: string, agentAvatarUrl?: string | null) => {
    if (_isConnecting) return;
    const state = get();
    if (state.customerConnection || state.memberConnection) {
      await state.disconnect();
    }

    _isConnecting = true;
    set({ agentId, agentName, agentAvatarUrl: agentAvatarUrl ?? null });

    // 同時連兩個 Hub
    try {
      await Promise.all([
        _connectCustomerHub(set, get, agentId, agentName),
        _connectMemberHub(set, get),
      ]);
    } finally {
      _isConnecting = false;
    }
  },

  disconnect: async () => {
    _isConnecting = false;
    const { customerConnection, memberConnection } = get();

    try {
      if (customerConnection) {
        await customerConnection.invoke('LeaveAgentGroup').catch(() => {});
        await customerConnection.stop();
      }
    } catch { /* ignore */ }

    try {
      if (memberConnection) {
        await memberConnection.stop();
      }
    } catch { /* ignore */ }

    set({
      customerConnection: null,
      customerConnectionState: 'disconnected',
      memberConnection: null,
      memberConnectionState: 'disconnected',
      onlineVisitors: [],
      activeSessionId: null,
      activeSession: null,
      visitorMessages: {},
      visitorUnreadCounts: {},
      visitorTotalUnread: 0,
      chatList: [],
      waitingChats: [],
      activeChatId: null,
      memberMessages: {},
      memberTotalUnread: 0,
      typingIndicators: {},
      totalUnreadCount: 0,
      agentId: null,
      agentName: null,
      agentAvatarUrl: null,
    });
  },

  // ==================== 訪客操作 ====================

  fetchOnlineVisitors: async () => {
    try {
      set({ isLoading: true });
      const visitors = await chatApi.getOnlineVisitors();
      set({ onlineVisitors: visitors });
      for (const v of visitors) {
        await get().fetchVisitorUnreadCount(v.sessionId);
      }
    } catch (error) {
      console.error('[ChatStore] fetchOnlineVisitors failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchVisitorSession: async (sessionId: string) => {
    try {
      const session = await chatApi.getVisitorSession(sessionId);
      if (session) set({ activeSession: session });
    } catch (error) {
      console.error('[ChatStore] fetchVisitorSession failed:', error);
    }
  },

  fetchChatHistory: async (sessionId: string, skip = 0, limit = 50) => {
    try {
      set({ isLoading: true });
      const messages = await chatApi.getChatHistory(sessionId, skip, limit);
      set((s) => ({
        visitorMessages: { ...s.visitorMessages, [sessionId]: messages },
      }));
    } catch (error) {
      console.error('[ChatStore] fetchChatHistory failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStatistics: async () => {
    try {
      const statistics = await chatApi.getStatistics();
      set({ statistics });
    } catch (error) {
      console.error('[ChatStore] fetchStatistics failed:', error);
    }
  },

  fetchVisitorUnreadCount: async (sessionId: string) => {
    try {
      const count = await chatApi.getUnreadMessageCount(sessionId);
      set((s) => ({
        visitorUnreadCounts: { ...s.visitorUnreadCounts, [sessionId]: count },
      }));
      get().updateTotalUnread();
    } catch (error) {
      console.error('[ChatStore] fetchVisitorUnreadCount failed:', error);
    }
  },

  sendVisitorMessage: async (sessionId: string, message: string) => {
    const { customerConnection, agentId, agentName, agentAvatarUrl } = get();
    if (!customerConnection || !agentId || !agentName) return;

    await customerConnection.invoke('SendMessageToVisitor', sessionId, message, agentId, agentName, agentAvatarUrl);

    const localMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      senderId: agentId,
      senderType: 'agent',
      senderName: agentName,
      content: message,
      messageType: 'text',
      isRead: true,
      createdTime: new Date().toISOString(),
      senderAvatarUrl: agentAvatarUrl,
    };
    get()._addVisitorMessage(sessionId, localMessage);
  },

  setActiveSession: async (sessionId: string | null) => {
    set({ activeSessionId: sessionId });
    if (sessionId) {
      await get().fetchVisitorSession(sessionId);
      await get().fetchChatHistory(sessionId);
      const messages = get().visitorMessages[sessionId] || [];
      for (const msg of messages) {
        if (!msg.isRead && msg.senderType === 'visitor') {
          await get().markVisitorMessageAsRead(msg.id);
        }
      }
      set((s) => ({
        visitorUnreadCounts: { ...s.visitorUnreadCounts, [sessionId]: 0 },
      }));
      get().updateTotalUnread();
    } else {
      set({ activeSession: null });
    }
  },

  markVisitorMessageAsRead: async (messageId: string) => {
    const { customerConnection } = get();
    if (!customerConnection) return;
    try {
      await customerConnection.invoke('MarkMessageAsRead', messageId);
      set((s) => {
        const newMessages = { ...s.visitorMessages };
        for (const sid in newMessages) {
          newMessages[sid] = newMessages[sid].map((m) =>
            m.id === messageId ? { ...m, isRead: true } : m
          );
        }
        return { visitorMessages: newMessages };
      });
    } catch (error) {
      console.error('[ChatStore] markVisitorMessageAsRead failed:', error);
    }
  },

  // ==================== 會員操作 ====================

  fetchChatList: async () => {
    try {
      set({ isLoading: true });
      const chatList = await memberChatApi.getChatList();
      set({ chatList });
    } catch (error) {
      console.error('[ChatStore] fetchChatList failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemberMessages: async (chatRecordId: number, skip = 0, take = 50) => {
    try {
      set({ isLoading: true });
      const messages = await memberChatApi.getMessages(chatRecordId, skip, take);
      set((s) => ({
        memberMessages: { ...s.memberMessages, [chatRecordId]: messages },
      }));
    } catch (error) {
      console.error('[ChatStore] fetchMemberMessages failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemberUnreadCount: async () => {
    try {
      const memberTotalUnread = await memberChatApi.getUnreadCount();
      set({ memberTotalUnread });
      get().updateTotalUnread();
    } catch (error) {
      console.error('[ChatStore] fetchMemberUnreadCount failed:', error);
    }
  },

  sendMemberMessage: async (chatRecordId: number, text: string) => {
    const { memberConnection } = get();
    if (!memberConnection) return;
    await memberConnection.invoke('SendMessage', chatRecordId, text);
  },

  markMemberAsRead: async (chatRecordId: number) => {
    const { memberConnection } = get();
    if (!memberConnection) return;
    try {
      await memberConnection.invoke('MarkAsRead', chatRecordId);
      set((s) => ({
        chatList: s.chatList.map((c) =>
          c.id === chatRecordId ? { ...c, unreadCount: 0 } : c
        ),
      }));
      await get().fetchMemberUnreadCount();
    } catch (error) {
      console.error('[ChatStore] markMemberAsRead failed:', error);
    }
  },

  sendTypingIndicator: async (chatRecordId: number) => {
    const { memberConnection } = get();
    if (!memberConnection) return;
    try {
      await memberConnection.invoke('SendTypingIndicator', chatRecordId);
    } catch { /* ignore */ }
  },

  setActiveChat: async (chatRecordId: number | null) => {
    set({ activeChatId: chatRecordId });
    if (chatRecordId) {
      await get().fetchMemberMessages(chatRecordId);
      await get().markMemberAsRead(chatRecordId);
    }
  },

  fetchWaitingChats: async () => {
    try {
      const waitingChats = await memberChatApi.getWaitingChats();
      set({ waitingChats });
    } catch (error) {
      console.error('[ChatStore] fetchWaitingChats failed:', error);
    }
  },

  claimChat: async (chatRecordId: number) => {
    const { memberConnection } = get();
    if (!memberConnection) return;
    try {
      await memberConnection.invoke('ClaimChat', chatRecordId);
      await get().fetchWaitingChats();
      await get().fetchChatList();
    } catch (error) {
      console.error('[ChatStore] claimChat failed:', error);
    }
  },

  leaveChat: async (chatRecordId: number) => {
    const { memberConnection } = get();
    if (!memberConnection) return;
    try {
      await memberConnection.invoke('LeaveChat', chatRecordId);
      set({ activeChatId: null });
      await get().fetchWaitingChats();
      await get().fetchChatList();
    } catch (error) {
      console.error('[ChatStore] leaveChat failed:', error);
    }
  },

  // ==================== UI ====================

  setActiveTab: (tab: ChatTab) => {
    set({ activeTab: tab, activeSessionId: null, activeChatId: null, activeSession: null });
  },

  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  openChat: (sessionId?: string) => {
    set({ isOpen: true });
    if (sessionId) {
      set({ activeTab: 'visitor' });
      void get().setActiveSession(sessionId);
    }
  },

  closeChat: () => {
    set({ isOpen: false, activeSessionId: null, activeChatId: null, activeSession: null });
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateTotalUnread: () => {
    const s = get();
    const visitorTotal = Object.values(s.visitorUnreadCounts).reduce((sum, c) => sum + c, 0);
    set({
      visitorTotalUnread: visitorTotal,
      totalUnreadCount: visitorTotal + s.memberTotalUnread,
    });
  },

  // ==================== 內部 ====================

  _addVisitorMessage: (sessionId: string, message: ChatMessage) => {
    set((s) => {
      const existing = s.visitorMessages[sessionId] || [];
      if (existing.some((m) => m.id === message.id)) return s;
      return {
        visitorMessages: { ...s.visitorMessages, [sessionId]: [...existing, message] },
      };
    });
  },

  _updateVisitorStatus: (sessionId: string, isOnline: boolean) => {
    set((s) => ({
      onlineVisitors: s.onlineVisitors.map((v) =>
        v.sessionId === sessionId
          ? { ...v, isOnline, disconnectedTime: isOnline ? undefined : new Date().toISOString() }
          : v
      ),
    }));
    const active = get().activeSession;
    if (active?.sessionId === sessionId) {
      set({
        activeSession: { ...active, isOnline, disconnectedTime: isOnline ? undefined : new Date().toISOString() },
      });
    }
  },

  _updateVisitorActivity: (sessionId: string, url: string, title?: string) => {
    set((s) => ({
      onlineVisitors: s.onlineVisitors.map((v) =>
        v.sessionId === sessionId
          ? { ...v, currentPage: url, currentPageTitle: title, lastActiveTime: new Date().toISOString() }
          : v
      ),
    }));
    const active = get().activeSession;
    if (active?.sessionId === sessionId) {
      set({
        activeSession: { ...active, currentPage: url, currentPageTitle: title, lastActiveTime: new Date().toISOString() },
      });
    }
  },
}));

// ==================== 內部：CustomerHub 連接 ====================

async function _connectCustomerHub(
  set: (partial: Partial<ChatStore> | ((s: ChatStore) => Partial<ChatStore>)) => void,
  get: () => ChatStore,
  _agentId: string,
  _agentName: string
) {
  set({ customerConnectionState: 'connecting' });

  try {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/customer', { withCredentials: true })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => {
          set({ customerConnectionState: 'reconnecting' });
          return 5000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on('ReceiveMessage', (event: MessageReceivedEvent) => {
      const message: ChatMessage = {
        id: event.messageId,
        sessionId: event.sessionId,
        senderType: event.senderType,
        senderName: event.senderName,
        content: event.content,
        messageType: 'text',
        isRead: false,
        createdTime: event.time,
        senderAvatarUrl: event.senderAvatarUrl,
      };
      get()._addVisitorMessage(event.sessionId, message);
      if (event.senderType === 'visitor') {
        const current = get().visitorUnreadCounts[event.sessionId] || 0;
        set((s) => ({
          visitorUnreadCounts: { ...s.visitorUnreadCounts, [event.sessionId]: current + 1 },
        }));
        get().updateTotalUnread();
      }
    });

    connection.on('UserConnected', async (_event: UserConnectedEvent) => {
      await get().fetchOnlineVisitors();
    });

    connection.on('UserDisconnected', (event: UserDisconnectedEvent) => {
      get()._updateVisitorStatus(event.sessionId, false);
    });

    connection.on('UserActivityUpdated', (event: UserActivityUpdatedEvent) => {
      get()._updateVisitorActivity(event.sessionId, event.url, event.title);
    });

    connection.onreconnecting(() => set({ customerConnectionState: 'reconnecting' }));
    connection.onreconnected(async () => {
      set({ customerConnectionState: 'connected' });
      try { await connection.invoke('JoinAgentGroup'); } catch { /* ignore */ }
    });
    connection.onclose(() => set({ customerConnectionState: 'disconnected' }));

    await connection.start();
    await connection.invoke('JoinAgentGroup');

    set({ customerConnection: connection, customerConnectionState: 'connected' });
    await get().fetchOnlineVisitors();
    await get().fetchStatistics();
  } catch (error) {
    console.error('[ChatStore] CustomerHub connection failed:', error);
    set({ customerConnectionState: 'disconnected' });
  }
}

// ==================== 內部：MemberHub 連接 ====================

async function _connectMemberHub(
  set: (partial: Partial<ChatStore> | ((s: ChatStore) => Partial<ChatStore>)) => void,
  get: () => ChatStore,
) {
  set({ memberConnectionState: 'connecting' });

  try {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/member', { withCredentials: true })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => {
          set({ memberConnectionState: 'reconnecting' });
          return 5000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on('ReceiveMessage', (message: MessageDto) => {
      set((s) => {
        const existing = s.memberMessages[message.chatRecordId] || [];
        if (existing.some((m) => m.id === message.id)) return {};
        return {
          memberMessages: {
            ...s.memberMessages,
            [message.chatRecordId]: [...existing, message],
          },
          chatList: s.chatList.map((c) =>
            c.id === message.chatRecordId
              ? {
                  ...c,
                  lastMessage: message,
                  unreadCount: s.activeChatId === message.chatRecordId ? c.unreadCount : c.unreadCount + 1,
                }
              : c
          ),
        };
      });
      get().fetchMemberUnreadCount();
      set((s) => ({
        typingIndicators: { ...s.typingIndicators, [message.chatRecordId]: null },
      }));
    });

    connection.on('MessagesRead', (event: MessagesReadEvent) => {
      set((s) => {
        const msgs = s.memberMessages[event.chatRecordId];
        if (!msgs) return {};
        return {
          memberMessages: {
            ...s.memberMessages,
            [event.chatRecordId]: msgs.map((m) => ({ ...m, isRead: true })),
          },
        };
      });
    });

    connection.on('UserTyping', (event: UserTypingEvent) => {
      set((s) => ({
        typingIndicators: { ...s.typingIndicators, [event.chatRecordId]: event.senderType },
      }));
      setTimeout(() => {
        set((s) => ({
          typingIndicators: { ...s.typingIndicators, [event.chatRecordId]: null },
        }));
      }, 3000);
    });

    connection.on('ChatCreated', (chat: ChatRecordDto) => {
      set((s) => {
        if (s.chatList.some((c) => c.id === chat.id)) return {};
        return { chatList: [chat, ...s.chatList] };
      });
    });

    connection.on('NewWaitingChat', (chat: ChatRecordDto) => {
      set((s) => {
        if (s.waitingChats.some((c) => c.id === chat.id)) return {};
        return { waitingChats: [chat, ...s.waitingChats] };
      });
    });

    connection.on('ChatClaimed', (chat: ChatRecordDto) => {
      set((s) => ({
        waitingChats: s.waitingChats.filter((c) => c.id !== chat.id),
        chatList: s.chatList.some((c) => c.id === chat.id)
          ? s.chatList.map((c) => c.id === chat.id ? chat : c)
          : [chat, ...s.chatList],
      }));
    });

    connection.on('ChatLeft', (chat: ChatRecordDto) => {
      set((s) => ({
        chatList: s.chatList.map((c) => c.id === chat.id ? chat : c),
        waitingChats: s.waitingChats.some((c) => c.id === chat.id)
          ? s.waitingChats
          : [chat, ...s.waitingChats],
      }));
    });

    connection.on('SystemMessage', (_event: SystemMessageEvent) => {
      // SystemMessage is primarily for member-side; admin can ignore or log
    });

    connection.onreconnecting(() => set({ memberConnectionState: 'reconnecting' }));
    connection.onreconnected(async () => {
      set({ memberConnectionState: 'connected' });
      await get().fetchChatList();
      await get().fetchWaitingChats();
      await get().fetchMemberUnreadCount();
    });
    connection.onclose(() => set({ memberConnectionState: 'disconnected' }));

    await connection.start();

    set({ memberConnection: connection, memberConnectionState: 'connected' });
    await get().fetchChatList();
    await get().fetchWaitingChats();
    await get().fetchMemberUnreadCount();
  } catch (error) {
    console.error('[ChatStore] MemberHub connection failed:', error);
    set({ memberConnectionState: 'disconnected' });
  }
}
