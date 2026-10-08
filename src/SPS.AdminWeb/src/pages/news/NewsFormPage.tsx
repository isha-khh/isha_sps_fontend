import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { newsApi } from '@/lib/api/news';
import { categoriesApi } from '@/lib/api/category';
import { tagsApi } from '@/lib/api/tags';
import { TagType, type Tag } from '@/types/taxonomy';
import type { CreateNewsRequest, UpdateNewsRequest } from '@/types/news';
import type { CategoryResponse } from '@/types/category';
import { PuckEditor } from '@/components/puck/PuckEditor';
import { useNotify } from '@/hooks/useNotify';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import type { NewsLink } from '@/types/news';

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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  // 附件（從檔案管理挑）、相關連結、聯絡資訊：前台公告詳情的「附件下載／相關連結／聯絡資訊」三個區塊
  const [attachments, setAttachments] = useState<{ fileId: string; name: string }[]>([]);
  const [relatedLinks, setRelatedLinks] = useState<NewsLink[]>([]);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

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

  // 載入可選的公告標籤（到「公告標籤」頁維護）
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const result = await tagsApi.getPaged({ type: TagType.News, page: 1, pageSize: 100 });
        setAvailableTags(result.items);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    void fetchTags();
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
          contactName: data.contactName ?? '',
          contactPhone: data.contactPhone ?? '',
          contactEmail: data.contactEmail ?? '',
        };
        setFormData(newsData);
        setAttachments((data.attachments ?? []).map((a) => ({ fileId: a.fileId, name: `${a.fileName}（${a.formattedFileSize}）` })));
        setRelatedLinks(data.relatedLinks ?? []);
        setSelectedTagIds((data.tagItems ?? []).map((t) => t.id));
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

  const handleAttachmentPick = async (file: FileListItem | FileUploadResponse) => {
    const picked = 'fileId' in file ? { fileId: file.fileId, name: file.fileName } : { fileId: file.id, name: file.originalFileName };
    setIsFilePickerOpen(false);
    if (attachments.some((a) => a.fileId === picked.fileId)) return;
    if (attachments.length >= 10) {
      await notify.warning('附件最多 10 個');
      return;
    }
    setAttachments((prev) => [...prev, picked]);
  };

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
          tagIds: selectedTagIds,
          attachmentFileIds: attachments.map((a) => a.fileId),
          relatedLinks: relatedLinks.filter((l) => l.title.trim() || l.url.trim()),
          contactName: formData.contactName ?? '',
          contactPhone: formData.contactPhone ?? '',
          contactEmail: formData.contactEmail ?? '',
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
          tagIds: selectedTagIds,
          attachmentFileIds: attachments.map((a) => a.fileId),
          relatedLinks: relatedLinks.filter((l) => l.title.trim() || l.url.trim()),
          contactName: formData.contactName || undefined,
          contactPhone: formData.contactPhone || undefined,
          contactEmail: formData.contactEmail || undefined,
        };
        console.log('[NewsFormPage] Creating new news');
        await newsApi.createNews(createData);
        console.log('[NewsFormPage] Create successful');
      }

      navigate('/announcements');
    } catch (error) {
      console.error('Failed to save news:', error);
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '儲存公告失敗，請稍後再試');
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

            {/* 附件、相關連結與聯絡資訊：前台公告詳情頁最下方的三個區塊，沒填的區塊不顯示 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body space-y-6">
                <h2 className="card-title">
                  <span className="iconify lucide--paperclip size-6" />
                  附件、相關連結與聯絡資訊
                </h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">附件下載</span>
                    <span className="label-text-alt text-base-content/60">公告發布後任何人都可以下載；最多 10 個</span>
                  </label>
                  {attachments.length > 0 && (
                    <ul className="mb-2 space-y-1">
                      {attachments.map((a, index) => (
                        <li className="flex items-center gap-2 rounded-box border border-base-300 px-3 py-2 text-sm" key={a.fileId}>
                          <span className="iconify lucide--paperclip size-4" />
                          <span className="flex-1 break-all">{a.name}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={index === 0}
                            onClick={() =>
                              setAttachments((prev) => {
                                const next = [...prev];
                                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                return next;
                              })
                            }
                            title="上移"
                          >
                            <span className="iconify lucide--arrow-up size-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setAttachments((prev) => prev.filter((x) => x.fileId !== a.fileId))}
                            title="移除"
                          >
                            <span className="iconify lucide--x size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div>
                    <button type="button" className="btn btn-sm btn-neutral" onClick={() => setIsFilePickerOpen(true)}>
                      <span className="iconify lucide--folder-open size-4" />
                      從檔案系統選擇附件
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">相關連結</span>
                    <span className="label-text-alt text-base-content/60">網址要 http 或 https 開頭；最多 10 筆</span>
                  </label>
                  <div className="space-y-2">
                    {relatedLinks.map((link, index) => (
                      <div className="flex flex-wrap items-center gap-2" key={index}>
                        <input
                          type="text"
                          className="input input-bordered input-sm flex-1 min-w-40"
                          placeholder="連結名稱"
                          maxLength={100}
                          value={link.title}
                          onChange={(e) => setRelatedLinks((prev) => prev.map((l, i) => (i === index ? { ...l, title: e.target.value } : l)))}
                        />
                        <input
                          type="url"
                          className="input input-bordered input-sm flex-[2] min-w-56"
                          placeholder="https://"
                          maxLength={500}
                          value={link.url}
                          onChange={(e) => setRelatedLinks((prev) => prev.map((l, i) => (i === index ? { ...l, url: e.target.value } : l)))}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setRelatedLinks((prev) => prev.filter((_, i) => i !== index))}
                          title="移除"
                        >
                          <span className="iconify lucide--x size-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-neutral"
                      disabled={relatedLinks.length >= 10}
                      onClick={() => setRelatedLinks((prev) => [...prev, { title: '', url: '' }])}
                    >
                      <span className="iconify lucide--plus size-4" />
                      新增連結
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">聯絡資訊</span>
                    <span className="label-text-alt text-base-content/60">三格都留空，前台就不顯示這個區塊</span>
                  </label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="聯絡人"
                      maxLength={100}
                      value={formData.contactName ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="聯絡電話"
                      maxLength={50}
                      value={formData.contactPhone ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                    <input
                      type="email"
                      className="input input-bordered"
                      placeholder="聯絡信箱"
                      maxLength={320}
                      value={formData.contactEmail ?? ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
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

                  {/* 公告標籤（多選）：前台公告卡片上的藍色關鍵字 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公告標籤</span>
                      <a href="/announcements/tags" target="_blank" rel="noreferrer" className="label-text-alt link link-primary">
                        管理標籤
                      </a>
                    </label>
                    {availableTags.length === 0 ? (
                      <p className="text-sm text-base-content/50">尚未建立任何標籤，請先到「公告標籤」新增</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const selected = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              aria-pressed={selected}
                              className={`badge badge-lg cursor-pointer ${selected ? 'badge-info' : 'badge-outline'}`}
                              onClick={() =>
                                setSelectedTagIds((prev) =>
                                  selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                                )
                              }
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
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

      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={(file) => void handleAttachmentPick(file)}
        fileType="all"
        title="選擇公告附件"
      />
    </div>
  );
};
