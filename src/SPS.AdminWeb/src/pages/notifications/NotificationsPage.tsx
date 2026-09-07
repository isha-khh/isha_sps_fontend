import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { notificationsApi } from '@/lib/api/notifications';
import { adminAuthApi } from '@/lib/api/admin-auth';
import type { NotificationResponse } from '@/types/notification';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const NotificationsPage = () => {
  const notify = useNotify();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    void fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void fetchNotifications();
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
      const data = await notificationsApi.getByRecipient(currentUser.email);
      setNotifications(data);
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
      console.error('Failed to mark as read:', error);
      await notify.error('標記已讀失敗');
    }
  };

  const handleMarkAllAsRead = async () => {
    const confirmed = await confirmDialog({
      cardTitle: '全部標記已讀',
      message: '確定要將所有通知標記為已讀嗎？',
      buttonConfirm: '確認',
    });
    if (!confirmed) return;

    try {
      const unreadNotifs = notifications.filter((n) => !n.read);
      await Promise.all(unreadNotifs.map((n) => notificationsApi.markAsRead(n.id)));
      await notify.success('已全部標記為已讀');
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      await notify.error('批量標記失敗');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({
      cardTitle: '刪除通知',
      message: '確定要刪除此通知嗎？',
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await notificationsApi.delete(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      await notify.error('刪除通知失敗');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedNotifications.length === 0) {
      await notify.warning('請先選擇要刪除的通知');
      return;
    }

    const confirmed = await confirmDialog({
      cardTitle: '批量刪除',
      message: `確定要刪除選中的 ${selectedNotifications.length} 條通知嗎？`,
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await Promise.all(selectedNotifications.map((id) => notificationsApi.delete(id)));
      await notify.success('批量刪除成功');
      setSelectedNotifications([]);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      await notify.error('批量刪除失敗');
    }
  };

  const toggleSelectNotification = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nid) => nid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  // 過濾通知
  const filteredNotifications = notifications.filter((notif) => {
    // 分類篩選
    if (selectedCategory !== 'all' && notif.category !== selectedCategory) {
      return false;
    }

    // 已讀/未讀篩選
    if (filterRead === 'read' && !notif.read) return false;
    if (filterRead === 'unread' && notif.read) return false;

    // 搜尋篩選
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const titleMatch = notif.title?.toLowerCase().includes(search) || false;
      const contentMatch = notif.content?.toLowerCase().includes(search) || false;
      return titleMatch || contentMatch;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="通知中心"
        items={[
          { label: '系統', path: '/system' },
          { label: '通知中心', active: true },
        ]}
      />

      {/* 統計和操作欄 */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <span className="iconify lucide--bell size-8" />
          </div>
          <div className="stat-title">總通知數</div>
          <div className="stat-value text-primary">{notifications.length}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-error">
            <span className="iconify lucide--bell-ring size-8" />
          </div>
          <div className="stat-title">未讀通知</div>
          <div className="stat-value text-error">{unreadCount}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-success">
            <span className="iconify lucide--check-check size-8" />
          </div>
          <div className="stat-title">已讀通知</div>
          <div className="stat-value text-success">{notifications.length - unreadCount}</div>
        </div>
      </div>

      {/* 篩選和搜尋 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <div className="input-group">
                <span className="bg-base-200">
                  <span className="iconify lucide--search size-5" />
                </span>
                <input
                  type="text"
                  placeholder="搜尋通知標題或內容..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">全部分類</option>
              <option value="team">團隊</option>
              <option value="ai">AI</option>
              <option value="system">系統</option>
            </select>

            <select
              className="select select-bordered"
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
            >
              <option value="all">全部狀態</option>
              <option value="unread">未讀</option>
              <option value="read">已讀</option>
            </select>

            <button className="btn btn-primary" onClick={() => void fetchNotifications()}>
              <span className="iconify lucide--refresh-cw size-5" />
              刷新
            </button>
          </div>

          {/* 批量操作 */}
          {selectedNotifications.length > 0 && (
            <div className="flex gap-2 mt-4 items-center">
              <span className="text-sm">
                已選擇 {selectedNotifications.length} 項
              </span>
              <button className="btn btn-sm btn-error" onClick={handleBatchDelete}>
                <span className="iconify lucide--trash-2 size-4" />
                批量刪除
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button className="btn btn-sm btn-success" onClick={handleMarkAllAsRead}>
              <span className="iconify lucide--check-check size-4" />
              全部標記已讀
            </button>
          </div>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--bell-off size-16 mb-4" />
              <p>暫無通知</p>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={
                      filteredNotifications.length > 0 &&
                      selectedNotifications.length === filteredNotifications.length
                    }
                    onChange={toggleSelectAll}
                  />
                  <span className="label-text">全選</span>
                </label>
              </div>

              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`card ${
                      !notification.read ? 'bg-primary/5 border-primary' : 'bg-base-200'
                    } border`}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary mt-1"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
                        />

                        <div
                          className={`avatar size-12 shrink-0 ${
                            !notification.read ? 'ring ring-primary ring-offset-2' : ''
                          }`}
                        >
                          <div
                            className={`mask mask-squircle flex items-center justify-center ${
                              notification.category === 'team'
                                ? 'bg-secondary'
                                : notification.category === 'ai'
                                ? 'bg-accent'
                                : 'bg-info'
                            }`}
                          >
                            <span
                              className={`iconify size-6 text-white ${
                                notification.category === 'team'
                                  ? 'lucide--users'
                                  : notification.category === 'ai'
                                  ? 'lucide--sparkles'
                                  : 'lucide--bell'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold">
                              {notification.title || '系統通知'}
                            </h3>
                            {notification.category && (
                              <span className="badge badge-sm badge-primary">
                                {notification.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-base-content/70 mt-1">
                            {notification.content || '無內容'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                            <span>
                              <span className="iconify lucide--clock size-3" />{' '}
                              {new Date(notification.createdTime).toLocaleString('zh-TW')}
                            </span>
                            {notification.expiration && (
                              <span>
                                <span className="iconify lucide--calendar size-3" /> 過期時間:{' '}
                                {new Date(notification.expiration).toLocaleDateString('zh-TW')}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3">
                            {!notification.read && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <span className="iconify lucide--check size-3" />
                                標記已讀
                              </button>
                            )}
                            <button
                              className="btn btn-xs btn-error btn-outline"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <span className="iconify lucide--trash-2 size-3" />
                              刪除
                            </button>
                          </div>
                        </div>

                        {!notification.read && (
                          <div className="status status-error size-2 shrink-0 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
