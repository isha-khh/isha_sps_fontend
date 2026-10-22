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
import { NEWS_SECTIONS, type NewsSection } from '@/lib/news-section';

/** `section`：0 公告（預設）、1 服務專區、2 補助公告、3 人才培育、4 產業輔導、5 補助資源，共用這個表單，差異見 `lib/news-section.ts` */
export const NewsFormPage = ({ section = 0 }: { section?: NewsSection }) => {
  const config = NEWS_SECTIONS[section];
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
    section,
  });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  // 課程類型（config.hasCourseTypes，人才培育）：到「課程類型」頁維護，前台知識加值的類型下拉用
  const [availableCourseTypes, setAvailableCourseTypes] = useState<Tag[]>([]);
  const [selectedCourseTypeIds, setSelectedCourseTypeIds] = useState<number[]>([]);
  // 多選分類（config.multiCategory 的專區，例如產業輔導的產業別）；其他專區仍用 formData.categoryId 單選
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  // 適用產業（config.industryCategoryType 的專區，例如政府補助資源）：另一組可多選的分類
  const [industries, setIndustries] = useState<CategoryResponse[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<number[]>([]);
  // 封面圖：從檔案系統挑圖片。`coverUrl` 是目前顯示的預覽（原本的封面或剛挑的圖），
  // `coverFileId` 只有這次換了新圖才有值，`removeCover` 代表要移除原本的封面
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [coverFileId, setCoverFileId] = useState<string | undefined>();
  const [removeCover, setRemoveCover] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  // 附件（服務專區用）：檔案管理中的檔案，依顯示順序；`attachmentNames` 只是畫面上顯示檔名用
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [attachmentNames, setAttachmentNames] = useState<Record<string, string>>({});
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  // 專區專屬欄位（人才培育的講師、產業輔導的主辦單位…），空字串 = 沒填
  const [meta, setMeta] = useState<Record<string, string>>({});

  // 使用 ref 保存最新的 Puck 內容
  const puckContentRef = useRef<string>('');

  // 載入分類列表
  useEffect(() => {
    if (config.categoryType === undefined) return;
    const categoryType = config.categoryType;
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(categoryType);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // 載入「適用產業」可選項目
  useEffect(() => {
    if (config.industryCategoryType === undefined) return;
    const industryType = config.industryCategoryType;
    categoriesApi
      .getCategoriesByType(industryType)
      .then((data) => setIndustries(data.filter((c) => c.published)))
      .catch((error) => console.error('Failed to fetch industries:', error));
  }, []);

  // 載入可選的公告標籤（到「公告標籤」頁維護）
  useEffect(() => {
    if (!config.hasTags) return;
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
    if (!config.hasCourseTypes) return;
    tagsApi
      .getPaged({ type: TagType.CourseType, page: 1, pageSize: 100 })
      .then((result) => setAvailableCourseTypes(result.items))
      .catch((error) => console.error('Failed to fetch course types:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          section: data.section ?? section,
        };
        setFormData(newsData);
        setAttachmentIds(data.attachmentFileIds ?? []);
        setMeta(data.meta ?? {});
        setCoverUrl(data.imageUrl || undefined);
        setSelectedTagIds((data.tagItems ?? []).map((t) => t.id));
        setSelectedCourseTypeIds((data.courseTypes ?? []).map((t) => t.id));
        setSelectedIndustryIds(data.industryIds ?? []);
        setSelectedCategoryIds(data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds : data.categoryId ? [data.categoryId] : []);
        // 初始化 ref
        puckContentRef.current = data.content || '';
        console.log('[NewsFormPage] Loaded existing content, length:', data.content?.length || 0);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        await notify.error(`載入${config.noun}失敗`);
        navigate(config.basePath);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [id, isEditMode, navigate]);

  const handleCoverPick = (file: FileListItem | FileUploadResponse) => {
    const id = 'fileId' in file ? file.fileId : file.id;
    setCoverFileId(id);
    setCoverUrl(`/api/FileManagement/${id}/download`);
    setRemoveCover(false);
    setIsCoverPickerOpen(false);
  };

  const handleCoverRemove = () => {
    setCoverFileId(undefined);
    setCoverUrl(undefined);
    setRemoveCover(true);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!formData.title.trim()) {
      await notify.warning(`請輸入${config.noun}標題`);
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
          // 欄位清空時 startDate／endDate 不會出現在送出的內容（undefined），後端會當成「不更新」而保留舊日期，要另外告知清除
          clearStartDate: !formData.startDate,
          clearEndDate: !formData.endDate,
          published: publish,
          ordinal: formData.ordinal,
          categoryId: config.multiCategory ? selectedCategoryIds[0] : formData.categoryId,
          ...(config.multiCategory ? { categoryIds: selectedCategoryIds } : {}),
          ...(config.industryCategoryType !== undefined ? { industryIds: selectedIndustryIds } : {}),
          type: formData.type,
          section,
          tagIds: selectedTagIds,
          ...(config.hasCourseTypes ? { courseTypeIds: selectedCourseTypeIds } : {}),
          ...(config.hasAttachments ? { attachmentFileIds: attachmentIds } : {}),
          ...(config.metaFields ? { meta } : {}),
          ...(coverFileId ? { coverFileId } : {}),
          ...(removeCover && !coverFileId ? { removeCover: true } : {}),
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
          categoryId: config.multiCategory ? selectedCategoryIds[0] : formData.categoryId,
          ...(config.multiCategory ? { categoryIds: selectedCategoryIds } : {}),
          ...(config.industryCategoryType !== undefined ? { industryIds: selectedIndustryIds } : {}),
          type: formData.type,
          section,
          tagIds: selectedTagIds,
          ...(config.hasCourseTypes ? { courseTypeIds: selectedCourseTypeIds } : {}),
          ...(config.hasAttachments ? { attachmentFileIds: attachmentIds } : {}),
          ...(config.metaFields ? { meta } : {}),
          ...(coverFileId ? { coverFileId } : {}),
        };
        console.log('[NewsFormPage] Creating new news');
        await newsApi.createNews(createData);
        console.log('[NewsFormPage] Create successful');
      }

      navigate(config.basePath);
    } catch (error) {
      console.error('Failed to save news:', error);
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || `儲存${config.noun}失敗，請稍後再試`);
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
        title={isEditMode ? `編輯${config.noun}` : `新增${config.noun}`}
        items={[
          { label: config.parentLabel, path: config.basePath },
          { label: config.listCrumb, path: config.basePath },
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
                  {config.noun}內容
                </h2>

                <div className="space-y-6">
                  {/* 公告標題 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        {config.noun}標題 <span className="text-error">*</span>
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
                      <span className="label-text font-medium">{config.noun}摘要</span>
                      <span className="label-text-alt text-base-content/60">
                        顯示在列表中的簡短說明
                      </span>
                    </label>
                    <textarea
                      placeholder={`簡短描述此${config.noun}的重點內容...`}
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
            {/* 封面圖 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-2">
                  <span className="iconify lucide--image size-5" />
                  封面圖
                </h3>
                <p className="text-sm text-base-content/60 mb-3">
                  顯示在前台公告列表、熱門文章與公告內頁最上方；沒有設定就不顯示圖片。建議 4:3 或 16:9 的橫式圖片。
                </p>
                {coverUrl ? (
                  <img src={coverUrl} alt="封面圖預覽" className="w-full rounded-box border border-base-300 object-cover max-h-56" />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-box border border-dashed border-base-300 text-sm text-base-content/50">
                    尚未設定封面圖
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn btn-sm btn-neutral" onClick={() => setIsCoverPickerOpen(true)}>
                    <span className="iconify lucide--folder-open size-4" />
                    {coverUrl ? '更換圖片' : '從檔案系統選擇'}
                  </button>
                  {coverUrl && (
                    <button type="button" className="btn btn-sm btn-ghost text-error" onClick={handleCoverRemove}>
                      <span className="iconify lucide--x size-4" />
                      移除
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 附件（服務專區）：不在公開頁面列出，使用者填完「立即下載」表單才拿得到下載連結 */}
            {config.hasAttachments && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title mb-2">
                    <span className="iconify lucide--paperclip size-5" />
                    下載附件
                  </h3>
                  <p className="text-sm text-base-content/60 mb-3">
                    從檔案系統挑選（最多 10 個）。前台詳情頁不會直接列出，使用者填寫「立即下載」表單並同意個資告知後才會看到下載連結；沒有附件的項目，表單送出會提示沒有可下載的文件。
                  </p>
                  {attachmentIds.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-box border border-dashed border-base-300 text-sm text-base-content/50">尚未選擇附件</div>
                  ) : (
                    <ul className="space-y-2">
                      {attachmentIds.map((fileId, index) => (
                        <li key={fileId} className="flex items-center gap-2 rounded-box border border-base-300 px-3 py-2 text-sm">
                          <span className="iconify lucide--file size-4 shrink-0" />
                          <span className="flex-1 truncate">{attachmentNames[fileId] ?? `檔案 ${fileId.slice(0, 8)}…`}</span>
                          <button type="button" className="btn btn-ghost btn-xs" disabled={index === 0} aria-label="上移" onClick={() => setAttachmentIds((prev) => { const next = [...prev]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>
                            <span className="iconify lucide--arrow-up size-3" />
                          </button>
                          <button type="button" className="btn btn-ghost btn-xs" disabled={index === attachmentIds.length - 1} aria-label="下移" onClick={() => setAttachmentIds((prev) => { const next = [...prev]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>
                            <span className="iconify lucide--arrow-down size-3" />
                          </button>
                          <button type="button" className="btn btn-ghost btn-xs text-error" aria-label="移除" onClick={() => setAttachmentIds((prev) => prev.filter((id) => id !== fileId))}>
                            <span className="iconify lucide--x size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3">
                    <button type="button" className="btn btn-sm btn-neutral" disabled={attachmentIds.length >= 10} onClick={() => setIsAttachmentPickerOpen(true)}>
                      <span className="iconify lucide--folder-open size-4" />
                      從檔案系統加入
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 分類與類型 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--tag size-5" />
                  分類設定
                </h3>

                <div className="space-y-4">
                  {/* 公告類型（只有公告有一般／重要／緊急） */}
                  {config.hasSeverityType && (
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
                  )}

                  {/* 公告分類 */}
                  {config.categoryType !== undefined && config.multiCategory && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">{config.categoryLabel ?? `${config.noun}分類`}</span>
                      <span className="label-text-alt text-base-content/60">
                        可多選
                        {config.categoriesPath && (
                          <>
                            {' · '}
                            <a href={config.categoriesPath} target="_blank" rel="noreferrer" className="link link-primary">管理{config.categoryLabel ?? '分類'}</a>
                          </>
                        )}
                      </span>
                    </label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-base-content/60">尚未建立{config.categoryLabel ?? '分類'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm checkbox-primary"
                              checked={selectedCategoryIds.includes(category.id)}
                              onChange={() =>
                                setSelectedCategoryIds((prev) =>
                                  prev.includes(category.id) ? prev.filter((x) => x !== category.id) : [...prev, category.id],
                                )
                              }
                            />
                            <span className="text-sm">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                  {config.categoryType !== undefined && !config.multiCategory && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">{config.categoryLabel ?? `${config.noun}分類`}</span>
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
                          {config.hasSubCategories && category.parentName ? `${category.parentName} › ${category.name}` : category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* 適用產業（可多選，政府補助資源） */}
                  {config.industryCategoryType !== undefined && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">{config.industryLabel ?? '適用產業'}</span>
                      <span className="label-text-alt text-base-content/60">
                        可多選
                        {config.industryCategoriesPath && (
                          <>
                            {' · '}
                            <a href={config.industryCategoriesPath} target="_blank" rel="noreferrer" className="link link-primary">管理{config.industryLabel ?? '適用產業'}</a>
                          </>
                        )}
                      </span>
                    </label>
                    {industries.length === 0 ? (
                      <p className="text-sm text-base-content/60">尚未建立{config.industryLabel ?? '適用產業'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {industries.map((industry) => (
                          <label key={industry.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm checkbox-primary"
                              checked={selectedIndustryIds.includes(industry.id)}
                              onChange={() =>
                                setSelectedIndustryIds((prev) =>
                                  prev.includes(industry.id) ? prev.filter((x) => x !== industry.id) : [...prev, industry.id],
                                )
                              }
                            />
                            <span className="text-sm">{industry.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {/* 課程類型（多選）：前台知識加值搜尋列的「類型」下拉 */}
                  {config.hasCourseTypes && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">課程類型</span>
                      <a href="/talent-courses/types" target="_blank" rel="noreferrer" className="label-text-alt link link-primary">
                        管理課程類型
                      </a>
                    </label>
                    {availableCourseTypes.length === 0 ? (
                      <p className="text-sm text-base-content/50">尚未建立任何課程類型，請先到「課程類型」新增</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableCourseTypes.map((courseType) => {
                          const selected = selectedCourseTypeIds.includes(courseType.id);
                          return (
                            <button
                              key={courseType.id}
                              type="button"
                              aria-pressed={selected}
                              className={`badge badge-lg cursor-pointer ${selected ? 'badge-primary' : 'badge-outline'}`}
                              onClick={() =>
                                setSelectedCourseTypeIds((prev) =>
                                  selected ? prev.filter((id) => id !== courseType.id) : [...prev, courseType.id]
                                )
                              }
                            >
                              {courseType.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  )}

                  {/* 公告標籤（多選）：前台公告卡片上的藍色關鍵字 */}
                  {config.hasTags && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">關鍵字標籤</span>
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
                  )}
                </div>
              </div>
            </div>

            {/* 專區專屬欄位（人才培育、產業輔導、補助資源） */}
            {config.metaFields && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title mb-4">
                    <span className="iconify lucide--list-checks size-5" />
                    {config.metaTitle ?? '專屬欄位'}
                  </h3>
                  <div className="space-y-4">
                    {config.metaFields.map((field) => (
                      <div className="form-control" key={field.key}>
                        <label className="label">
                          <span className="label-text font-medium">{field.label}</span>
                          {field.hint && <span className="label-text-alt text-base-content/60">{field.hint}</span>}
                        </label>
                        <input
                          type={field.type ?? 'text'}
                          className="input input-bordered"
                          placeholder={field.placeholder}
                          maxLength={field.type === 'date' || field.type === 'number' ? undefined : 500}
                          value={meta[field.key] ?? ''}
                          onChange={(e) => setMeta((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
        isOpen={isAttachmentPickerOpen}
        onClose={() => setIsAttachmentPickerOpen(false)}
        onSelect={(file) => {
          // 檔案挑選器回傳兩種形狀：已存在的檔案（id、originalFileName）或剛上傳的檔案（fileId、fileName）
          const fileId = 'fileId' in file ? file.fileId : file.id;
          const name = 'fileId' in file ? file.fileName : file.originalFileName;
          setAttachmentIds((prev) => (prev.includes(fileId) || prev.length >= 10 ? prev : [...prev, fileId]));
          setAttachmentNames((prev) => ({ ...prev, [fileId]: name }));
          setIsAttachmentPickerOpen(false);
        }}
        title="選擇下載附件"
      />
      <FilePickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={(file) => handleCoverPick(file)}
        fileType="image"
        title="選擇公告封面圖"
      />
    </div>
  );
};
