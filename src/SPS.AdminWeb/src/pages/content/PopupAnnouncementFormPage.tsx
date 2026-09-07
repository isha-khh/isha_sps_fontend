import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { popupAnnouncementApi } from '@/lib/api/popup-announcement';
import type {
  CreatePopupAnnouncementRequest,
  UpdatePopupAnnouncementRequest,
} from '@/types/popup-announcement';
import { PopupFrequency } from '@/types/popup-announcement';
import { useNotify } from '@/hooks/useNotify';

const frequencyOptions = [
  { value: PopupFrequency.Always, label: '每次顯示' },
  { value: PopupFrequency.OncePerSession, label: '每 Session 一次' },
  { value: PopupFrequency.OncePerDay, label: '每天一次' },
  { value: PopupFrequency.OnceOnly, label: '只顯示一次' },
];

export const PopupAnnouncementFormPage = () => {
  const notify = useNotify();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [routeInput, setRouteInput] = useState('');

  const [formData, setFormData] = useState<CreatePopupAnnouncementRequest>({
    title: '',
    content: '',
    imageId: undefined,
    linkUrl: '',
    linkTarget: '_blank',
    routes: ['/'],
    frequency: PopupFrequency.OncePerSession,
    priority: 0,
    startDate: undefined,
    endDate: undefined,
    showCloseButton: true,
    showDontShowToday: true,
    published: false,
    ordinal: 0,
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchData(parseInt(id));
    }
  }, [id, isNew]);

  const fetchData = async (announcementId: number) => {
    setIsLoading(true);
    try {
      const data = await popupAnnouncementApi.getById(announcementId);
      setFormData({
        title: data.title,
        content: data.content || '',
        imageId: data.imageId,
        linkUrl: data.linkUrl || '',
        linkTarget: data.linkTarget || '_blank',
        routes: data.routes || ['/'],
        frequency: data.frequency,
        priority: data.priority,
        startDate: data.startDate ? data.startDate.split('T')[0] : undefined,
        endDate: data.endDate ? data.endDate.split('T')[0] : undefined,
        showCloseButton: data.showCloseButton,
        showDontShowToday: data.showDontShowToday,
        published: data.published,
        ordinal: data.ordinal,
      });
    } catch (error) {
      console.error('Failed to fetch popup announcement:', error);
      await notify.error('載入彈窗公告失敗');
      navigate('/content/popup-announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.routes.length === 0) {
      await notify.warning('請至少指定一個適用路由');
      return;
    }

    setIsSaving(true);
    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      if (isNew) {
        await popupAnnouncementApi.create(submitData);
      } else {
        await popupAnnouncementApi.update(parseInt(id!), submitData as UpdatePopupAnnouncementRequest);
      }
      navigate('/content/popup-announcements');
    } catch (error) {
      console.error('Failed to save popup announcement:', error);
      await notify.error('儲存彈窗公告失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const addRoute = () => {
    const route = routeInput.trim();
    if (route && !formData.routes.includes(route)) {
      setFormData({ ...formData, routes: [...formData.routes, route] });
      setRouteInput('');
    }
  };

  const removeRoute = (route: string) => {
    setFormData({ ...formData, routes: formData.routes.filter((r) => r !== route) });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={isNew ? '新增彈窗公告' : '編輯彈窗公告'}
        items={[
          { label: '內容管理', path: '/content' },
          { label: '彈窗公告', path: '/content/popup-announcements' },
          { label: isNew ? '新增' : '編輯', active: true },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要內容 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">基本資訊</h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      標題 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">內容</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="彈窗顯示的內容..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">連結網址</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      value={formData.linkUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">連結開啟方式</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.linkTarget || '_blank'}
                      onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                    >
                      <option value="_blank">新視窗開啟</option>
                      <option value="_self">目前視窗開啟</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">適用路由</h3>
                <p className="text-sm text-base-content/60">
                  指定在哪些頁面路由顯示此彈窗公告
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value={routeInput}
                    onChange={(e) => setRouteInput(e.target.value)}
                    placeholder="輸入路由，例如: / 或 /products"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRoute();
                      }
                    }}
                  />
                  <button type="button" className="btn btn-neutral" onClick={addRoute}>
                    <span className="iconify lucide--plus size-5" />
                    新增
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.routes.map((route) => (
                    <div key={route} className="badge badge-lg gap-2">
                      {route}
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => removeRoute(route)}
                      >
                        <span className="iconify lucide--x size-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {formData.routes.length === 0 && (
                  <div className="alert alert-warning">
                    <span className="iconify lucide--alert-triangle size-5" />
                    <span>請至少指定一個適用路由</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">發布設定</h3>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    />
                    <span className="label-text font-medium">立即發布</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">顯示頻率</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: parseInt(e.target.value) as PopupFrequency })
                    }
                  >
                    {frequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">優先順序</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <label className="label">
                    <span className="label-text-alt">數字越大優先顯示</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">有效期間</h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">開始日期</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">結束日期</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">顯示選項</h3>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.showCloseButton}
                      onChange={(e) => setFormData({ ...formData, showCloseButton: e.target.checked })}
                    />
                    <span className="label-text">顯示關閉按鈕</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.showDontShowToday}
                      onChange={(e) => setFormData({ ...formData, showDontShowToday: e.target.checked })}
                    />
                    <span className="label-text">顯示「今日不再顯示」選項</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/content/popup-announcements')}
          >
            取消
          </button>
          <button type="submit" className="btn btn-success" disabled={isSaving}>
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <span className="iconify lucide--save size-5" />
                儲存
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
