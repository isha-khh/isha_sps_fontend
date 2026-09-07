import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { mouApi } from '@/lib/api/mou';
import type { CreateMouRequest, UpdateMouRequest } from '@/types/mou';
import { MouStatus } from '@/types/mou';
import { useNotify } from '@/hooks/useNotify';

export const MouFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<CreateMouRequest>({
    title: '',
    companyId: 0,
    status: MouStatus.Draft,
    description: '',
    attachments: [],
  });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchMou = async () => {
      setIsLoading(true);
      try {
        const data = await mouApi.getMouById(Number(id));
        setFormData({
          title: data.title,
          companyId: data.companyId,
          signDate: data.signDate,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          description: data.description,
          attachments: data.attachments,
        });
      } catch (error) {
        console.error('Failed to fetch MOU:', error);
        await notify.error('載入備忘錄失敗');
        navigate('/mou');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMou();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      await notify.warning('請輸入備忘錄標題');
      return;
    }

    if (!formData.companyId || formData.companyId === 0) {
      await notify.warning('請選擇簽署公司');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateMouRequest = {
          title: formData.title,
          companyId: formData.companyId,
          signDate: formData.signDate,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          description: formData.description,
          attachments: formData.attachments,
        };
        await mouApi.updateMou(Number(id), updateData);
      } else {
        await mouApi.createMou(formData);
      }

      navigate('/mou');
    } catch (error) {
      console.error('Failed to save MOU:', error);
      await notify.error('儲存備忘錄失敗，請稍後再試');
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
        title={isEditMode ? '編輯備忘錄' : '新增備忘錄'}
        items={[
          { label: '備忘錄管理', path: '/mou' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主要內容 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--file-edit size-6" />
                  備忘錄資訊
                </h2>

                <div className="space-y-6">
                  {/* 備忘錄標題 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        備忘錄標題 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如：石化產品供應合作備忘錄"
                      className="input input-bordered"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* 簽署公司 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        簽署公司 <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.companyId}
                      onChange={(e) =>
                        setFormData({ ...formData, companyId: Number(e.target.value) })
                      }
                      required
                    >
                      <option value={0}>請選擇簽署公司</option>
                      <option value={1}>台塑石化股份有限公司</option>
                      <option value={2}>中國石油化學工業開發股份有限公司</option>
                      <option value={3}>李長榮化學工業股份有限公司</option>
                      <option value={4}>和桐化學股份有限公司</option>
                      <option value={5}>台灣中油股份有限公司</option>
                      <option value={6}>亞洲聚合股份有限公司</option>
                      <option value={7}>南亞塑膠工業股份有限公司</option>
                      <option value={8}>台橡股份有限公司</option>
                      <option value={9}>華夏海灣塑膠股份有限公司</option>
                      <option value={10}>國喬石油化學股份有限公司</option>
                    </select>
                  </div>

                  {/* 備忘錄描述 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">備忘錄內容</span>
                      <span className="label-text-alt text-base-content/60">
                        詳細說明合作內容與條款
                      </span>
                    </label>
                    <textarea
                      placeholder="請詳細描述備忘錄的合作內容、雙方權利義務、合作範圍等..."
                      className="textarea textarea-bordered h-64"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <label className="label">
                      <span className="label-text-alt">
                        {formData.description?.length || 0} 字
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            {/* 狀態設定 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--settings size-5" />
                  狀態設定
                </h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">備忘錄狀態</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value={MouStatus.Draft}>草稿</option>
                    <option value={MouStatus.Active}>有效</option>
                    <option value={MouStatus.Expired}>已過期</option>
                    <option value={MouStatus.Terminated}>已終止</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 時間設定 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--calendar size-5" />
                  時間設定
                </h3>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">簽署日期</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={
                        formData.signDate
                          ? new Date(formData.signDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          signDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        });
                      }}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">生效日期</span>
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
                      <span className="label-text font-medium">到期日期</span>
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
                </div>
              </div>
            </div>

            {/* 附件上傳 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <span className="iconify lucide--paperclip size-5" />
                  附件上傳
                </h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">上傳檔案</span>
                  </label>
                  <input type="file" className="file-input file-input-bordered" multiple />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      支援 PDF、Word、Excel 等格式
                    </span>
                  </label>
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-base-content/60 mb-2">已上傳檔案</div>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                        >
                          <span className="iconify lucide--file size-4 text-primary" />
                          <div className="flex-1 text-sm truncate">{file}</div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                attachments: formData.attachments?.filter((_, i) => i !== index),
                              });
                            }}
                          >
                            <span className="iconify lucide--x size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              <button type="submit" className="btn btn-success" disabled={isSaving}>
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--save size-5" />
                    {isEditMode ? '儲存變更' : '建立備忘錄'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
