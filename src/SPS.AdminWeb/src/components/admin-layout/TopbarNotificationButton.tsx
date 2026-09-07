import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { notificationsApi } from '@/lib/api/notifications';
import { adminAuthApi } from '@/lib/api/admin-auth';
import type { NotificationResponse } from '@/types/notification';

export const TopbarNotificationButton = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'team' | 'ai' | 'system' | 'cs'>('all');
  const { totalUnreadCount, openChat, setActiveTab: setChatTab } = useChatStore();

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    void fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void fetchNotifications();

      // 每 30 秒輪詢一次更新
      const interval = setInterval(() => {
        void fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const user = await adminAuthApi.getProfile();
      setCurrentUser({ id: user.id, email: user.email });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [notifByEmail, notifById, countEmail, countId] = await Promise.all([
        notificationsApi.getByRecipient(currentUser.email),
        notificationsApi.getByRecipient(currentUser.id),
        notificationsApi.getUnreadCount(currentUser.email),
        notificationsApi.getUnreadCount(currentUser.id),
      ]);
      // Merge and deduplicate by id
      const merged = [...notifByEmail, ...notifById];
      const seen = new Set<number>();
      const notifList = merged.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
      setNotifications(notifList);
      setUnreadCount(countEmail + countId);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const closeMenu = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const handleOpenChat = () => {
    closeMenu();
    openChat();
  };

  // 過濾通知
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'team') return notif.category === 'team';
    if (activeTab === 'ai') return notif.category === 'ai';
    if (activeTab === 'system') return notif.category === 'system';
    if (activeTab === 'cs') return notif.category === 'CustomerService';
    return true;
  });

  // 計算各標籤的數量
  const teamCount = notifications.filter((n) => n.category === 'team').length;
  const aiCount = notifications.filter((n) => n.category === 'ai').length;
  const systemCount = notifications.filter((n) => n.category === 'system').length;
  const csCount = notifications.filter((n) => n.category === 'CustomerService').length;

  const totalNotificationBadge = unreadCount + totalUnreadCount;

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-circle btn-ghost btn-sm relative"
        aria-label="Notifications"
      >
        <span className="iconify lucide--bell motion-preset-seesaw size-4.5" />
        {totalNotificationBadge > 0 && (
          <div className="status status-error status-sm absolute end-1 top-1 animate-pulse"></div>
        )}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-base-100 rounded-box mt-1 w-84 shadow-md duration-1000 hover:shadow-lg"
      >
        <div className="bg-base-200/30 rounded-t-box border-base-200 border-b ps-4 pe-2 pt-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">通知</p>
            <button className="btn btn-xs btn-circle btn-ghost" aria-label="Close" onClick={closeMenu}>
              <span className="iconify lucide--x size-4" />
            </button>
          </div>
          <div className="-ms-2 mt-2 -mb-px flex items-center justify-between">
            <div role="tablist" className="tabs tabs-sm tabs-border">
              <div
                role="tab"
                onClick={() => setActiveTab('all')}
                className={`tab gap-2 px-3 ${activeTab === 'all' ? 'tab-active font-medium' : ''}`}
              >
                <span>全部</span>
                {notifications.length > 0 && (
                  <div className="badge badge-sm">{notifications.length}</div>
                )}
              </div>
              <div
                role="tab"
                onClick={() => setActiveTab('team')}
                className={`tab gap-2 px-3 ${activeTab === 'team' ? 'tab-active font-medium' : ''}`}
              >
                <span>團隊</span>
                {teamCount > 0 && <div className="badge badge-sm">{teamCount}</div>}
              </div>
              <div
                role="tab"
                onClick={() => setActiveTab('ai')}
                className={`tab gap-2 px-3 ${activeTab === 'ai' ? 'tab-active font-medium' : ''}`}
              >
                <span>AI</span>
                {aiCount > 0 && <div className="badge badge-sm">{aiCount}</div>}
              </div>
              <div
                role="tab"
                onClick={() => setActiveTab('system')}
                className={`tab gap-2 px-3 ${activeTab === 'system' ? 'tab-active font-medium' : ''}`}
              >
                <span>系統</span>
                {systemCount > 0 && <div className="badge badge-sm">{systemCount}</div>}
              </div>
              <div
                role="tab"
                onClick={() => setActiveTab('cs')}
                className={`tab gap-2 px-3 ${activeTab === 'cs' ? 'tab-active font-medium' : ''}`}
              >
                <span>客服</span>
                {csCount > 0 && <div className="badge badge-sm badge-warning">{csCount}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 聊天未讀消息通知 */}
        {totalUnreadCount > 0 && (
          <>
            <div
              className="hover:bg-base-200/20 relative flex items-start gap-3 p-4 transition-all cursor-pointer"
              onClick={handleOpenChat}
            >
              <div className="avatar size-12">
                <div className="mask mask-squircle bg-primary flex items-center justify-center">
                  <span className="iconify lucide--message-circle size-6 text-primary-content" />
                </div>
              </div>
              <div className="grow">
                <p className="text-sm leading-tight font-medium">
                  您有 {totalUnreadCount} 條未讀聊天消息
                </p>
                <p className="text-base-content/60 text-xs">點擊查看訪客消息</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChat();
                    }}
                  >
                    <span className="iconify lucide--message-circle size-4" />
                    打開聊天
                  </button>
                </div>
              </div>
              <div className="status status-error absolute end-4 top-4 size-1.5 animate-pulse"></div>
            </div>
            <hr className="border-base-300 border-dashed" />
          </>
        )}

        {/* 通知列表 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <span className="iconify lucide--bell-off size-16 mb-2" />
            <p className="text-sm">暫無通知</p>
          </div>
        ) : (
          <>
            {filteredNotifications.slice(0, 5).map((notification) => (
              <div key={notification.id}>
                <div
                  className={`hover:bg-base-200/20 relative flex items-start gap-3 p-4 transition-all ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="avatar size-12">
                    <div
                      className={`mask mask-squircle flex items-center justify-center ${
                        notification.category === 'team'
                          ? 'bg-secondary'
                          : notification.category === 'ai'
                          ? 'bg-accent'
                          : notification.category === 'CustomerService'
                          ? 'bg-warning'
                          : 'bg-info'
                      }`}
                    >
                      <span
                        className={`iconify size-6 text-white ${
                          notification.category === 'team'
                            ? 'lucide--users'
                            : notification.category === 'ai'
                            ? 'lucide--sparkles'
                            : notification.category === 'CustomerService'
                            ? 'lucide--headphones'
                            : 'lucide--bell'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grow">
                    <p className="text-sm leading-tight font-medium">
                      {notification.title || '系統通知'}
                    </p>
                    <p className="text-base-content/70 text-xs mt-1 line-clamp-2">
                      {notification.content || '無內容'}
                    </p>
                    <p className="text-base-content/60 text-xs mt-1">
                      {new Date(notification.createdTime).toLocaleString('zh-TW')}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {!notification.read && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <span className="iconify lucide--check size-3" />
                          標記已讀
                        </button>
                      )}
                      {notification.category === 'CustomerService' && (
                        <button
                          className="btn btn-xs btn-warning"
                          onClick={() => {
                            handleMarkAsRead(notification.id);
                            closeMenu();
                            setChatTab('member');
                            openChat();
                          }}
                        >
                          <span className="iconify lucide--headphones size-3" />
                          前往領收
                        </button>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="status status-primary absolute end-4 top-4 size-1.5 animate-pulse"></div>
                  )}

                  <button
                    className="btn btn-xs btn-ghost btn-circle absolute end-2 bottom-2"
                    onClick={() => handleDeleteNotification(notification.id)}
                    title="刪除通知"
                  >
                    <span className="iconify lucide--x size-3" />
                  </button>
                </div>
                <hr className="border-base-300 border-dashed" />
              </div>
            ))}
          </>
        )}

        <hr className="border-base-200" />
        <div className="flex items-center justify-between px-2 py-2">
          <button className="btn btn-sm btn-soft btn-primary" onClick={closeMenu}>
            關閉
          </button>

          <div className="flex items-center gap-1">
            <button
              className="btn btn-sm btn-square btn-ghost"
              onClick={() => void fetchNotifications()}
              title="刷新通知"
            >
              <span className="iconify lucide--refresh-cw size-4" />
            </button>
            {unreadCount > 0 && (
              <span className="badge badge-sm badge-error">{unreadCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
