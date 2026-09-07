import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { useChatStore } from '@/stores/chat-store';
import { ChatWindow } from '@/components/chat/ChatWindow';

export const ChatPage = () => {
  const {
    onlineVisitors,
    isLoading,
    activeSessionId,
    customerConnectionState,
    visitorUnreadCounts,
    setActiveSession,
    fetchOnlineVisitors,
  } = useChatStore();

  const [searchTerm, setSearchTerm] = useState('');

  // 連線由 ChatBubble (AdminLayout) 統一管理，這裡只做定期刷新
  useEffect(() => {
    if (customerConnectionState === 'connected') {
      fetchOnlineVisitors();
      const interval = setInterval(() => {
        fetchOnlineVisitors();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [customerConnectionState, fetchOnlineVisitors]);

  const filteredVisitors = onlineVisitors.filter((visitor) => {
    const sessionIdMatch = visitor.sessionId.toLowerCase().includes(searchTerm.toLowerCase());
    const ipMatch = visitor.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    return sessionIdMatch || ipMatch;
  });

  const handleViewConversation = (sessionId: string) => {
    setActiveSession(sessionId);
  };

  const handleBack = () => {
    setActiveSession(null);
  };

  if (activeSessionId) {
    return <ChatWindow sessionId={activeSessionId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="聊一聊"
        items={[{ label: '聊一聊', active: true }]}
      />

      {customerConnectionState !== 'connected' && (
        <div className="alert alert-info">
          <span className="iconify lucide--info size-5" />
          <span>
            {customerConnectionState === 'connecting' && '正在連接聊天服務...'}
            {customerConnectionState === 'reconnecting' && '正在重新連接...'}
            {customerConnectionState === 'disconnected' && '已斷開連接'}
          </span>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="form-control flex-1">
          <div className="input-group">
            <span className="bg-base-200">
              <span className="iconify lucide--search size-5" />
            </span>
            <input
              type="text"
              placeholder="搜尋會話 ID 或 IP 地址..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{onlineVisitors.length}</span> 個在線訪客
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--message-circle size-16 mb-4" />
              <p>{searchTerm ? '未找到匹配的訪客' : '目前沒有在線訪客'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>會話 ID</th>
                    <th>IP 地址</th>
                    <th>當前頁面</th>
                    <th>連接時間</th>
                    <th>最後活動</th>
                    <th>未讀</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.sessionId}>
                      <td>
                        <div className="font-mono text-sm">{visitor.sessionId.substring(0, 8)}...</div>
                      </td>
                      <td>
                        <div className="text-sm">{visitor.ipAddress || '-'}</div>
                      </td>
                      <td>
                        <div className="max-w-xs truncate text-sm">
                          {visitor.currentPageTitle || visitor.currentPage || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {visitor.firstConnectedTime
                            ? new Date(visitor.firstConnectedTime).toLocaleString('zh-TW')
                            : '-'}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {visitor.lastActiveTime
                            ? new Date(visitor.lastActiveTime).toLocaleString('zh-TW')
                            : '-'}
                        </div>
                      </td>
                      <td>
                        {visitorUnreadCounts[visitor.sessionId] > 0 && (
                          <span className="badge badge-error">{visitorUnreadCounts[visitor.sessionId]}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${visitor.isOnline ? 'badge-success' : 'badge-ghost'}`}>
                          {visitor.isOnline ? '線上' : '離線'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewConversation(visitor.sessionId)}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--message-square size-4" />
                            查看對話
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
