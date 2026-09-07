import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { newsApi } from '@/lib/api/news';
import type { News } from '@/types/news';
import { PuckRenderer } from '@/components/puck/PuckRenderer';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const NewsDetailPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await newsApi.getNewsById(Number(id));
        setNews(data);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        await notify.error('載入公告失敗');
        navigate('/announcements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [id, navigate]);

  const handleTogglePublish = async () => {
    if (!news) return;

    try {
      const updated = await newsApi.togglePublish(news.id, !news.published);
      setNews(updated);
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      await notify.error('更新發布狀態失敗');
    }
  };

  const handleDelete = async () => {
    if (!news) return;

    const confirmed = await confirmDialog({
      cardTitle: '刪除公告',
      message: '確定要刪除此公告嗎？此操作無法復原。',
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await newsApi.deleteNews(news.id);
      navigate('/announcements');
    } catch (error) {
      console.error('Failed to delete news:', error);
      await notify.error('刪除公告失敗');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="iconify lucide--alert-circle size-16 text-error mb-4" />
          <p className="text-lg">找不到此公告</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="公告詳情"
        items={[
          { label: '內容管理', path: '/announcements' },
          { label: '公告內容', path: '/announcements' },
          { label: news.title, active: true },
        ]}
      />

      {/* 操作列 */}
      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <div className="flex-1" />
        <Link to={`/announcements/${id}/edit`} className="btn btn-neutral">
          <span className="iconify lucide--edit size-4" />
          編輯
        </Link>
        <button onClick={handleTogglePublish} className="btn btn-info">
          <span className={`iconify ${news.published ? 'lucide--eye-off' : 'lucide--eye'} size-4`} />
          {news.published ? '取消發布' : '發布公告'}
        </button>
        <button onClick={handleDelete} className="btn btn-error">
          <span className="iconify lucide--trash-2 size-4" />
          刪除
        </button>
      </div>

      {/* 公告狀態 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{news.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                <span>
                  建立時間：{formatDateTime(news.createdTime)}
                </span>
                {news.updatedTime && (
                  <span>
                    最後更新：{formatDateTime(news.updatedTime)}
                  </span>
                )}
              </div>
            </div>
            <div>
              {news.published ? (
                <span className="badge badge-success badge-lg gap-2">
                  <span className="iconify lucide--eye size-4" />
                  已發布
                </span>
              ) : (
                <span className="badge badge-warning badge-lg gap-2">
                  <span className="iconify lucide--eye-off size-4" />
                  草稿
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 公告資訊 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本資訊 */}
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title mb-4">
              <span className="iconify lucide--file-text size-6" />
              公告內容
            </h3>

            {news.introduction && (
              <div className="mb-6">
                <div className="text-sm font-medium text-base-content/60 mb-2">公告摘要</div>
                <div className="p-4 bg-base-200 rounded-lg">
                  <p className="text-base-content/80">{news.introduction}</p>
                </div>
              </div>
            )}

            {news.content && (
              <div>
                <div className="text-sm font-medium text-base-content/60 mb-2">詳細內容</div>
                <div className="rounded-lg overflow-hidden">
                  <PuckRenderer content={news.content} />
                </div>
              </div>
            )}

            {!news.introduction && !news.content && (
              <div className="text-center py-8 text-base-content/40">
                <span className="iconify lucide--file-text size-12 mb-2" />
                <p>暫無內容</p>
              </div>
            )}
          </div>
        </div>

        {/* 側邊欄資訊 */}
        <div className="space-y-6">
          {/* 分類與標籤 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--tag size-5" />
                分類與標籤
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-2">公告分類</div>
                  {news.categoryName ? (
                    <span className="badge badge-outline badge-lg">{news.categoryName}</span>
                  ) : (
                    <span className="text-base-content/50">未分類</span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-2">標籤</div>
                  {news.tags && news.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {news.tags.map((tag, index) => (
                        <span key={index} className="badge badge-ghost">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-base-content/50">無標籤</span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-2">類型</div>
                  <span className="badge badge-neutral">
                    {news.type === 0 && '一般公告'}
                    {news.type === 1 && '重要公告'}
                    {news.type === 2 && '緊急公告'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 發布時間 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--calendar size-5" />
                發布時間
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-1">開始日期</div>
                  <div className="text-base-content">{formatDate(news.startDate)}</div>
                </div>

                {news.endDate && (
                  <div>
                    <div className="text-sm font-medium text-base-content/60 mb-1">結束日期</div>
                    <div className="text-base-content">{formatDate(news.endDate)}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-1">排序順序</div>
                  <div className="text-base-content">{news.ordinal}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
