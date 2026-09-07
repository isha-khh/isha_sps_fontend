import { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MemberConversationList } from './MemberConversationList';
import { MemberChatWindow } from './MemberChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatBubble = () => {
  const {
    isOpen,
    activeTab,
    totalUnreadCount,
    visitorTotalUnread,
    memberTotalUnread,
    // 訪客
    activeSessionId,
    customerConnectionState,
    memberConnectionState,
    agentId,
    // 會員
    activeChatId,
    // 操作
    connect,
    disconnect,
    setActiveTab,
    setActiveSession,
    setActiveChat,
    toggleChat,
    closeChat,
    fetchOnlineVisitors,
    fetchChatList,
    fetchWaitingChats,
  } = useChatStore();

  const { user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);

  // 連接兩個 Hub
  useEffect(() => {
    if (user?.id && user?.name && !agentId) {
      const avatarUrl = user.avatarUrl ?? '/api/FileManagement/865c35a0-38a2-46fd-8f48-a54920f6fc20/download';
      connect(user.id, user.name, avatarUrl).catch((error) => {
        console.error('[ChatBubble] Failed to connect:', error);
      });
    }

    return () => {
      if (agentId) {
        disconnect();
      }
    };
  }, [user, agentId, connect, disconnect]);

  // 定期刷新
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    if (customerConnectionState === 'connected') {
      intervals.push(setInterval(() => fetchOnlineVisitors(), 30000));
    }
    if (memberConnectionState === 'connected') {
      intervals.push(setInterval(() => { fetchChatList(); fetchWaitingChats(); }, 30000));
    }
    return () => intervals.forEach(clearInterval);
  }, [customerConnectionState, memberConnectionState, fetchOnlineVisitors, fetchChatList, fetchWaitingChats]);

  const isConnected = customerConnectionState === 'connected' || memberConnectionState === 'connected';
  const isConnecting = customerConnectionState === 'connecting' || memberConnectionState === 'connecting';
  const isReconnecting = customerConnectionState === 'reconnecting' || memberConnectionState === 'reconnecting';

  const handleBack = () => {
    if (activeTab === 'visitor') setActiveSession(null);
    else setActiveChat(null);
  };

  // 判斷是否在聊天視窗內
  const isInChat = activeTab === 'visitor' ? !!activeSessionId : !!activeChatId;

  return (
    <AnimatePresence mode="wait">
      {/* 泡泡按鈕 */}
      {!isOpen && (
        <motion.button
          key="chat-bubble-btn"
          onClick={toggleChat}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 0.9 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 btn btn-circle btn-primary w-16 h-16 shadow-xl"
          aria-label="打開聊天"
        >
          <span className="iconify lucide--message-circle size-6" />
          {totalUnreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-xs font-bold text-error-content"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            height: isMinimized ? 56 : 700,
            width: 550,
          }}
          exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          className="fixed bottom-6 right-6 z-50 bg-base-100 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        >
          {/* 標題欄 */}
          <div className="flex items-center justify-between p-4 border-b border-base-300 bg-primary text-primary-content shrink-0 h-14">
            <div className="flex items-center gap-2">
              <span className="iconify lucide--message-circle size-6" />
              <h3 className="font-semibold">聊天中心</h3>
              {totalUnreadCount > 0 && (
                <span className="badge badge-error badge-sm animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </div>

            {/* 連接狀態 */}
            {!isConnected && (
              <div className="badge badge-sm badge-warning gap-1">
                {isConnecting && (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    連接中
                  </>
                )}
                {isReconnecting && (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    重新連接
                  </>
                )}
                {!isConnecting && !isReconnecting && '已斷線'}
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="btn btn-ghost btn-sm btn-circle text-primary-content"
              >
                <motion.span
                  animate={{ rotate: isMinimized ? 180 : 0 }}
                  className="iconify lucide--chevron-down size-5"
                />
              </button>
              <button
                onClick={closeChat}
                className="btn btn-ghost btn-sm btn-circle text-primary-content"
              >
                <span className="iconify lucide--x size-5" />
              </button>
            </div>
          </div>

          {/* 內容區 */}
          <motion.div
            className="flex-1 overflow-hidden flex flex-col"
            animate={{ opacity: isMinimized ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {!isMinimized && (
              <>
                {/* Tab 切換（不在聊天視窗內時顯示） */}
                {!isInChat && (
                  <div className="flex border-b border-base-300 shrink-0">
                    <button
                      onClick={() => setActiveTab('visitor')}
                      className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors relative ${
                        activeTab === 'visitor'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-base-content/60 hover:text-base-content'
                      }`}
                    >
                      <span className="iconify lucide--globe size-4 inline-block mr-1 align-text-bottom" />
                      訪客客服
                      {visitorTotalUnread > 0 && (
                        <span className="badge badge-error badge-xs ml-1">
                          {visitorTotalUnread}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('member')}
                      className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors relative ${
                        activeTab === 'member'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-base-content/60 hover:text-base-content'
                      }`}
                    >
                      <span className="iconify lucide--users size-4 inline-block mr-1 align-text-bottom" />
                      會員聊天
                      {memberTotalUnread > 0 && (
                        <span className="badge badge-error badge-xs ml-1">
                          {memberTotalUnread}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 內容 */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeTab === 'visitor' ? (
                    activeSessionId ? (
                      <ChatWindow sessionId={activeSessionId} onBack={handleBack} />
                    ) : (
                      <ConversationList onSelect={(sid) => setActiveSession(sid)} />
                    )
                  ) : (
                    activeChatId ? (
                      <MemberChatWindow chatRecordId={activeChatId} onBack={handleBack} />
                    ) : (
                      <MemberConversationList onSelect={(id) => setActiveChat(id)} />
                    )
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
