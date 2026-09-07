import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { regulationsApi } from '@/lib/api/regulations';
import { categoriesApi } from '@/lib/api/category';
import { PuckEditor } from '@/components/puck/PuckEditor';
import type { CreateRegulationsRequest, UpdateRegulationsRequest } from '@/types/regulations';
import type { CategoryResponse } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 法規分類的 type 值 (對應後端 CategoryType.Regulations = 4)
const REGULATIONS_CATEGORY_TYPE = 4;

export const RegulationFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<CreateRegulationsRequest>({
    name: '',
    title: '',
    content: '',
    published: false,
    type: 0,
    ordinal: 0,
  });
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // 使用 ref 保存最新的 Puck 內容
  const puckContentRef = useRef<string>('');

  // 載入類別列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(REGULATIONS_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // 載入法規資料 (編輯模式)
  useEffect(() => {
    if (!isEditMode) return;

    const fetchRegulation = async () => {
      setIsLoading(true);
      try {
        const data = await regulationsApi.getById(Number(id));
        setFormData({
          name: data.name || '',
          title: data.title || '',
          content: data.content || '',
          published: data.published,
          type: data.type,
          ordinal: data.ordinal,
          categoryId: data.categoryId,
        });
        // 初始化 ref
        puckContentRef.current = data.content || '';
      } catch (error) {
        console.error('Failed to fetch regulation:', error);
        await notify.error('載入法規失敗');
        navigate('/knowledge/regulations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegulation();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (publish: boolean) => {
    if (!formData.name?.trim()) {
      await notify.warning('請輸入條號');
      return;
    }

    // 使用 ref 中的最新內容
    const latestContent = puckContentRef.current;

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateRegulationsRequest = {
          ...formData,
          content: latestContent,
          published: publish,
        };
        await regulationsApi.update(Number(id), updateData);
      } else {
        const createData: CreateRegulationsRequest = {
          ...formData,
          content: latestContent,
          published: publish,
        };
        await regulationsApi.create(createData);
      }
      navigate('/knowledge/regulations');
    } catch (error) {
      console.error('Failed to save regulation:', error);
      await notify.error('儲存法規失敗');
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
        title={isEditMode ? '編輯法條' : '新增法條'}
        items={[
          { label: '知識庫', path: '/knowledge' },
          { label: '法條內文', path: '/knowledge/regulations' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主要內容 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <span className="iconify lucide--file-text size-5" />
                法條內容
              </h2>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      條號 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：第 1 條"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">標題</span>
                  </label>
                  <input
                    type="text"
                    placeholder="法條標題"
                    className="input input-bordered"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">內容</span>
                    <span className="label-text-alt text-base-content/60">
                      使用視覺化編輯器編輯內容
                    </span>
                  </label>
                  <PuckEditor
                    initialContent={formData.content}
                    onChange={(jsonContent) => {
                      puckContentRef.current = jsonContent;
                      setFormData((prev) => ({ ...prev, content: jsonContent }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 側邊欄設定 */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--settings size-5" />
                設定
              </h3>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">分類</span>
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">排序</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered"
                    value={formData.ordinal}
                    onChange={(e) => setFormData({ ...formData, ordinal: Number(e.target.value) })}
                  />
                </div>
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
                  發布
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
