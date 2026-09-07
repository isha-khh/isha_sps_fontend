import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

interface ConversationListProps {
  onSelect: (conversationId: string) => void;
}

export const ConversationList = ({ onSelect }: ConversationListProps) => {
  const { onlineVisitors, visitorUnreadCounts, isLoading, visitorMessages } = useChatStore();
  const [onlineOpen, setOnlineOpen] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-TW');
  };

  const getVisitorName = (visitor: any) => {
    return visitor.gaClientId || visitor.sessionId.substring(0, 8);
  };

  const getLastMessage = (sessionId: string) => {
    const sessionMessages = visitorMessages[sessionId];
    if (!sessionMessages || sessionMessages.length === 0) return null;
    return sessionMessages[sessionMessages.length - 1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!onlineVisitors || onlineVisitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-base-content/60">
        <span className="iconify lucide--inbox size-16 mb-4" />
        <p>暫無訪客</p>
      </div>
    );
  }

  const online = onlineVisitors.filter((v) => v.isOnline);
  const offline = onlineVisitors.filter((v) => !v.isOnline);

  const renderVisitor = (visitor: any) => {
    const lastMessage = getLastMessage(visitor.sessionId);
    const unreadCount = visitorUnreadCounts[visitor.sessionId] || 0;

    return (
      <button
        key={visitor.sessionId}
        onClick={() => onSelect(visitor.sessionId)}
        className="w-full p-3 hover:bg-base-200 border-b border-base-300 text-left transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="avatar placeholder">
            <div className={`${visitor.isOnline ? 'bg-primary' : 'bg-base-300'} text-primary-content rounded-full w-10 relative`}>
              <span className="text-sm">
                {getVisitorName(visitor).charAt(0).toUpperCase()}
              </span>
              {visitor.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-base-content truncate">
                {getVisitorName(visitor)}
              </span>
              <span className="text-xs text-base-content/60">
                {formatTime(visitor.lastActiveTime)}
              </span>
            </div>
            {lastMessage ? (
              <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-base-content' : 'text-base-content/70'}`}>
                {lastMessage.senderType === 'agent' && '我: '}
                {lastMessage.content}
              </p>
            ) : (
              <p className="text-sm text-base-content/60 truncate">
                {visitor.currentPageTitle || visitor.currentPage || '正在瀏覽...'}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <div className="badge badge-error badge-sm">{unreadCount}</div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* 線上 */}
      <div className="collapse collapse-arrow bg-base-100 rounded-none border-b border-base-300">
        <input type="checkbox" checked={onlineOpen} onChange={() => setOnlineOpen(!onlineOpen)} />
        <div className="collapse-title text-sm font-semibold py-2 min-h-0">
          <span className="iconify lucide--circle text-success size-3 inline-block mr-1" />
          線上 ({online.length})
        </div>
        <div className="collapse-content !p-0">
          {online.length === 0 ? (
            <p className="text-sm text-base-content/60 p-3">目前沒有線上訪客</p>
          ) : (
            online.map(renderVisitor)
          )}
        </div>
      </div>

      {/* 離線 */}
      <div className="collapse collapse-arrow bg-base-100 rounded-none border-b border-base-300">
        <input type="checkbox" checked={offlineOpen} onChange={() => setOfflineOpen(!offlineOpen)} />
        <div className="collapse-title text-sm font-semibold py-2 min-h-0">
          <span className="iconify lucide--circle text-base-content/30 size-3 inline-block mr-1" />
          離線 ({offline.length})
        </div>
        <div className="collapse-content !p-0">
          {offline.length === 0 ? (
            <p className="text-sm text-base-content/60 p-3">沒有離線訪客</p>
          ) : (
            offline.map(renderVisitor)
          )}
        </div>
      </div>
    </div>
  );
};
