import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { successCasesApi } from '@/lib/api/success-cases';
import { categoriesApi } from '@/lib/api/category';
import { PuckEditor } from '@/components/puck/PuckEditor';
import { ImageUploadField } from '@/components/puck/ImageUploadField';
import type { CreateSuccessCaseRequest } from '@/types/success-case';
import type { CategoryResponse } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 產業類別的 type 值 (對應後端 CategoryType.Business = 7)
const BUSINESS_CATEGORY_TYPE = 7;

export const SuccessCaseFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateSuccessCaseRequest>({
    title: '',
    companyName: '',
    industry: '',
    coverImageUrl: '',
    summary: '',
    content: '',
    publishedDate: '',
    isPublished: false,
  });

  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // 使用 ref 保存最新的 Puck 內容
  const puckContentRef = useRef<string>('');

  // 載入類別列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(BUSINESS_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      void fetchSuccessCase(Number(id));
    }
  }, [id, isEditMode]);

  const fetchSuccessCase = async (caseId: number) => {
    setIsLoading(true);
    try {
      const data = await successCasesApi.getSuccessCaseById(caseId);
      setFormData({
        title: data.title,
        companyName: data.companyName,
        industry: data.industry,
        coverImageUrl: data.coverImageUrl || '',
        summary: data.summary,
        content: data.content,
        publishedDate: data.publishedDate || '',
        isPublished: data.isPublished,
      });
      // 初始化 ref
      puckContentRef.current = data.content || '';
    } catch (error) {
      console.error('Failed to fetch success case:', error);
      await notify.success('無法載入成功案例');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      await notify.warning('請輸入案例標題');
      return;
    }
    if (!formData.companyName.trim()) {
      await notify.warning('請輸入公司名稱');
      return;
    }
    if (!formData.industry.trim()) {
      await notify.warning('請選擇產業類別');
      return;
    }
    if (!formData.summary.trim()) {
      await notify.warning('請輸入案例摘要');
      return;
    }

    // 使用 ref 中的最新內容
    const latestContent = puckContentRef.current;

    setIsSaving(true);
    try {
      const submitData: CreateSuccessCaseRequest = {
        ...formData,
        content: latestContent,
        isPublished: publish,
        publishedDate: publish && !formData.publishedDate ? new Date().toISOString() : formData.publishedDate,
      };

      if (isEditMode && id) {
        await successCasesApi.updateSuccessCase(Number(id), submitData);
      } else {
        await successCasesApi.createSuccessCase(submitData);
      }

      navigate('/success-cases');
    } catch (error) {
      console.error('Failed to save success case:', error);
      await notify.success('儲存成功案例失敗');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={isEditMode ? '編輯成功案例' : '新增成功案例'}
        items={[
          { label: '成功案例', path: '/success-cases' },
          { label: isEditMode ? '編輯案例' : '新增案例', active: true },
        ]}
      />

      <form className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要內容 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">基本資訊</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      案例標題 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：智慧製造轉型 - 提升產能50%"
                    className="input input-bordered"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        公司名稱 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如：台塑石化股份有限公司"
                      className="input input-bordered"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        產業類別 <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      required
                    >
                      <option value="">請選擇產業</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-control">
                  <ImageUploadField
                    value={formData.coverImageUrl || ''}
                    onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                    label="封面圖片"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      案例摘要 <span className="text-error">*</span>
                    </span>
                  </label>
                  <textarea
                    placeholder="請輸入案例的簡短摘要（100-200字）..."
                    className="textarea textarea-bordered h-24"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      {formData.summary.length} 字
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">
                  案例內容 <span className="text-error">*</span>
                </h2>
                <p className="text-sm text-base-content/60">使用視覺化編輯器編輯內容</p>

                <div className="form-control">
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

          {/* 側邊欄 */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-lg">發布設定</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">發布日期</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={
                      formData.publishedDate
                        ? new Date(formData.publishedDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publishedDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                      })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text font-medium">立即發布</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-lg">操作</h2>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="btn btn-success w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <span className="iconify lucide--check size-4" />
                        儲存並發布
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    className="btn btn-neutral w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <span className="iconify lucide--save size-4" />
                        儲存草稿
                      </>
                    )}
                  </button>

                  <Link to="/success-cases" className="btn btn-ghost w-full">
                    <span className="iconify lucide--x size-4" />
                    取消
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
