import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { popupAnnouncementApi } from '@/lib/api/popup-announcement';
import type { PopupAnnouncementListItem, PopupAnnouncementSearchParams } from '@/types/popup-announcement';
import { PopupFrequency } from '@/types/popup-announcement';
import { useNotify } from '@/hooks/useNotify';

const frequencyLabels: Record<number, string> = {
  [PopupFrequency.Always]: '每次顯示',
  [PopupFrequency.OncePerSession]: '每 Session 一次',
  [PopupFrequency.OncePerDay]: '每天一次',
  [PopupFrequency.OnceOnly]: '只顯示一次',
};

export const PopupAnnouncementsPage = () => {
  const notify = useNotify();
  const [announcements, setAnnouncements] = useState<PopupAnnouncementListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchParams, setSearchParams] = useState<PopupAnnouncementSearchParams>({});
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await popupAnnouncementApi.getPopupAnnouncements(
        currentPage,
        pageSize,
        searchParams
      );
      setAnnouncements(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch popup announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, search: searchText }));
    setCurrentPage(1);
  };

  const handleTogglePublish = async (id: number, published: boolean) => {
    try {
      await popupAnnouncementApi.togglePublish(id, published);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      await notify.error('更新發布狀態失敗');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此彈窗公告嗎？')) return;
    try {
      await popupAnnouncementApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete popup announcement:', error);
      await notify.error('刪除彈窗公告失敗');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle
        title="彈窗公告管理"
        items={[
          { label: '內容管理', path: '/content' },
          { label: '彈窗公告', active: true },
        ]}
      />

      {/* 操作列 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜尋公告標題..."
            className="input input-bordered flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button type="submit" className="btn btn-neutral">
            <span className="iconify lucide--search size-5" />
            搜尋
          </button>
        </form>

        <div className="flex gap-2">
          <Link to="/content/popup-announcements/new/edit" className="btn btn-success">
            <span className="iconify lucide--plus size-5" />
            新增彈窗公告
          </Link>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            {/* 發布狀態篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">發布狀態</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.published === undefined ? '' : String(searchParams.published)}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    published: value === '' ? undefined : value === 'true',
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部</option>
                <option value="true">已發布</option>
                <option value="false">未發布</option>
              </select>
            </div>

            {/* 重置篩選 */}
            {(searchParams.published !== undefined || searchText) && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text opacity-0">Reset</span>
                </label>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearchParams({});
                    setSearchText('');
                    setCurrentPage(1);
                  }}
                >
                  <span className="iconify lucide--x size-5" />
                  清除篩選
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="flex items-center justify-between text-sm text-base-content/60">
        <div>
          共找到 <span className="font-semibold text-base-content">{totalCount}</span> 筆彈窗公告
        </div>
        {totalPages > 1 && (
          <div>
            第 <span className="font-semibold text-base-content">{currentPage}</span> / {totalPages} 頁
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--inbox size-12 mx-auto mb-4" />
              <p>目前沒有彈窗公告</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>標題</th>
                    <th>適用路由</th>
                    <th>顯示頻率</th>
                    <th>優先順序</th>
                    <th>有效期間</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.title}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {item.routes.slice(0, 3).map((route, idx) => (
                            <span key={idx} className="badge badge-ghost badge-sm">
                              {route}
                            </span>
                          ))}
                          {item.routes.length > 3 && (
                            <span className="badge badge-ghost badge-sm">
                              +{item.routes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{frequencyLabels[item.frequency] || '未知'}</td>
                      <td>{item.priority}</td>
                      <td>
                        <div className="text-sm">
                          <div>{formatDate(item.startDate)} ~</div>
                          <div>{formatDate(item.endDate)}</div>
                        </div>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="toggle toggle-success toggle-sm"
                          checked={item.published}
                          onChange={(e) => handleTogglePublish(item.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/content/popup-announcements/${item.id}/edit`}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--edit size-4" />
                          </Link>
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDelete(item.id)}
                          >
                            <span className="iconify lucide--trash-2 size-4" />
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

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${pageNum === currentPage ? 'btn-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="join-item btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
