import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { questionsApi } from '@/lib/api/questions';
import { categoriesApi } from '@/lib/api/category';
import { PuckEditor } from '@/components/puck/PuckEditor';
import type { CreateQuestionRequest, UpdateQuestionRequest } from '@/types/question';
import type { CategoryResponse } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 問答分類的 type 值 (對應後端 CategoryType.Question = 3)
const QUESTION_CATEGORY_TYPE = 3;

export const FaqFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<CreateQuestionRequest>({
    subject: '',
    answer: '',
    published: false,
    ordinal: 0,
  });
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // 使用 ref 保存最新的 Puck 內容 (答案)
  const puckAnswerRef = useRef<string>('');

  // 載入類別列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(QUESTION_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // 載入問題資料 (編輯模式)
  useEffect(() => {
    if (!isEditMode) return;

    const fetchQuestion = async () => {
      setIsLoading(true);
      try {
        const data = await questionsApi.getById(Number(id));
        setFormData({
          subject: data.subject || '',
          answer: data.answer || '',
          published: data.published,
          ordinal: data.ordinal,
          categoryId: data.categoryId,
        });
        // 初始化 ref
        puckAnswerRef.current = data.answer || '';
      } catch (error) {
        console.error('Failed to fetch question:', error);
        await notify.error('載入問題失敗');
        navigate('/knowledge/faq');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (publish: boolean) => {
    if (!formData.subject?.trim()) {
      await notify.warning('請輸入問題');
      return;
    }

    // 使用 ref 中的最新內容
    const latestAnswer = puckAnswerRef.current;

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateQuestionRequest = {
          ...formData,
          answer: latestAnswer,
          published: publish,
        };
        await questionsApi.update(Number(id), updateData);
      } else {
        const createData: CreateQuestionRequest = {
          ...formData,
          answer: latestAnswer,
          published: publish,
        };
        await questionsApi.create(createData);
      }
      navigate('/knowledge/faq');
    } catch (error) {
      console.error('Failed to save question:', error);
      await notify.error('儲存問題失敗');
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
        title={isEditMode ? '編輯問題' : '新增問題'}
        items={[
          { label: '知識庫', path: '/knowledge' },
          { label: '問題回覆', path: '/knowledge/faq' },
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
                <span className="iconify lucide--help-circle size-5" />
                問題內容
              </h2>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      問題 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：如何註冊帳號？"
                    className="input input-bordered"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      答案 <span className="text-error">*</span>
                    </span>
                    <span className="label-text-alt text-base-content/60">
                      使用視覺化編輯器編輯內容
                    </span>
                  </label>
                  <PuckEditor
                    initialContent={formData.answer}
                    onChange={(jsonContent) => {
                      puckAnswerRef.current = jsonContent;
                      setFormData((prev) => ({ ...prev, answer: jsonContent }));
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
