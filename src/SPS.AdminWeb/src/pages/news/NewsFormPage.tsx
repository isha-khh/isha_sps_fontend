import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { newsApi } from '@/lib/api/news';
import { categoriesApi } from '@/lib/api/category';
import type { CreateNewsRequest, UpdateNewsRequest } from '@/types/news';
import type { CategoryResponse } from '@/types/category';
import { PuckEditor } from '@/components/puck/PuckEditor';
import { useNotify } from '@/hooks/useNotify';

// 公告分類的 type 值 (對應後端 CategoryType.News = 1)
const NEWS_CATEGORY_TYPE = 1;

export const NewsFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<CreateNewsRequest>({
    title: '',
    introduction: '',
    content: '',
    published: false,
    type: 0,
  });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // 使用 ref 保存最新的 Puck 內容
  const puckContentRef = useRef<string>('');

  // 載入分類列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(NEWS_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const data = await newsApi.getNewsById(Number(id));
        const newsData = {
          title: data.title,
          introduction: data.introduction,
          content: data.content,
          startDate: data.startDate,
          endDate: data.endDate,
          published: data.published,
          ordinal: data.ordinal,
          categoryId: data.categoryId,
          type: data.type,
        };
        setFormData(newsData);
        // 初始化 ref
        puckContentRef.current = data.content || '';
        console.log('[NewsFormPage] Loaded existing content, length:', data.content?.length || 0);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        await notify.error('載入公告失敗');
        navigate('/announcements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (publish: boolean) => {
    if (!formData.title.trim()) {
      await notify.warning('請輸入公告標題');
      return;
    }

    // 使用 ref 中的最新內容
    const latestContent = puckContentRef.current;
    console.log('[NewsFormPage] Submitting news');
    console.log('  - Content from state:', formData.content?.length || 0, 'chars');
    console.log('  - Content from ref:', latestContent?.length || 0, 'chars');
    console.log('  - Using content:', latestContent.substring(0, 200));

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateNewsRequest = {
          title: formData.title,
          introduction: formData.introduction,
          content: latestContent, // 使用 ref 中的最新值
          startDate: formData.startDate,
          endDate: formData.endDate,
          published: publish,
          ordinal: formData.ordinal,
          categoryId: formData.categoryId,
          type: formData.type,
        };
        console.log('[NewsFormPage] Updating news with ID:', id);
        await newsApi.updateNews(Number(id), updateData);
        console.log('[NewsFormPage] Update successful');
      } else {
        const createData: CreateNewsRequest = {
          title: formData.title,
          introduction: formData.introduction,
          content: latestContent, // 使用 ref 中的最新值
          startDate: formData.startDate,
          endDate: formData.endDate,
          published: publish,
          ordinal: formData.ordinal,
          categoryId: formData.categoryId,
          type: formData.type,
        };
        console.log('[NewsFormPage] Creating new news');
        await newsApi.createNews(createData);
        console.log('[NewsFormPage] Create successful');
      }

      navigate('/announcements');
    } catch (error) {
      console.error('Failed to save news:', error);
      await notify.error('儲存公告失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={isEditMode ? '編輯公告' : '新增公告'}
        items={[
          { label: '內容管理', path: '/announcements' },
          { label: '公告內容', path: '/announcements' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      <div>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主要內容 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--file-edit size-6" />
                  公告內容
                </h2>

                <div className="space-y-6">
                  {/* 公告標題 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        公告標題 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如：平台系統維護通知"
                      className="input input-bordered"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* 公告摘要 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公告摘要</span>
                      <span className="label-text-alt text-base-content/60">
                        顯示在列表中的簡短說明
                      </span>
                    </label>
                    <textarea
                      placeholder="簡短描述此公告的重點內容..."
                      className="textarea textarea-bordered h-24"
                      value={formData.introduction}
                      onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                    />
                    <label className="label">
                      <span className="label-text-alt">
                        {formData.introduction?.length || 0} 字
                      </span>
                    </label>
                  </div>

                  {/* 詳細內容 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">詳細內容</span>
                      <span className="label-text-alt text-base-content/60">
                        使用視覺化編輯器編輯內容
                      </span>
                    </label>
                    <PuckEditor
                      initialContent={formData.content}
                      onChange={(jsonContent) => {
                        console.log('[NewsFormPage] PuckEditor onChange triggered, new content length:', jsonContent.length);
                        // 同時更新 state 和 ref
                        puckContentRef.current = jsonContent;
                        setFormData((prev) => ({ ...prev, content: jsonContent }));
                      }}
                    />
                    {/* 調試信息 */}
                    <div className="mt-2 p-2 bg-base-200 rounded text-xs space-y-1">
                      <div>
                        <strong>State 內容長度:</strong> {formData.content?.length || 0} 字元
                      </div>
                      <div>
                        <strong>Ref 內容長度 (實際保存):</strong> {puckContentRef.current?.length || 0} 字元
                      </div>
                      {puckContentRef.current && puckContentRef.current.length > 0 && (
                        <div>
                          <strong>內容預覽:</strong> {puckContentRef.current.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            {/* 分類與類型 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--tag size-5" />
                  分類設定
                </h3>

                <div className="space-y-4">
                  {/* 公告類型 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公告類型</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: Number(e.target.value) })
                      }
                    >
                      <option value={0}>一般公告</option>
                      <option value={1}>重要公告</option>
                      <option value={2}>緊急公告</option>
                    </select>
                  </div>

                  {/* 公告分類 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公告分類</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.categoryId ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          categoryId: value === '' ? undefined : Number(value),
                        });
                      }}
                    >
                      <option value="">未分類</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 發布時間 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--calendar size-5" />
                  發布時間
                </h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">開始日期</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={
                        formData.startDate
                          ? new Date(formData.startDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          startDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        });
                      }}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">結束日期</span>
                      <span className="label-text-alt text-base-content/60">可選</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={
                        formData.endDate
                          ? new Date(formData.endDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          endDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        });
                      }}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">排序順序</span>
                      <span className="label-text-alt text-base-content/60">數字越大越前面</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={formData.ordinal ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          ordinal: value === '' ? undefined : Number(value),
                        });
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 提示資訊 */}
            <div className="alert alert-info">
              <span className="iconify lucide--info size-5" />
              <div>
                <h4 className="font-bold">發布說明</h4>
                <div className="text-sm mt-1">
                  • 儲存為草稿：僅保存內容，不會公開顯示
                  <br />• 立即發布：公告將顯示在前台頁面
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={isSaving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="btn btn-neutral"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--save size-5" />
                    儲存草稿
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="btn btn-success"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--send size-5" />
                    立即發布
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
