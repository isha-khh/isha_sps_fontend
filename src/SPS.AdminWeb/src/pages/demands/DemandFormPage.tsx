import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { demandsApi } from '@/lib/api/demands';
import type { CreateDemandRequest, UpdateDemandRequest } from '@/types/demand';
import type { CompanyTagOption } from '@/types/company';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { TagCategoryTreeSelect } from '@/components/shared/TagCategoryTreeSelect';
import { ProTrackImportModal } from '@/components/shared/ProTrackImportModal';
import { SimilarCompaniesPanel } from '@/components/shared/SimilarCompaniesPanel';
import { DemandEmailPreviewModal } from '@/components/shared/DemandEmailPreviewModal';
import { DemandNotificationProgressModal } from '@/components/shared/DemandNotificationProgressModal';
import { useNotify } from '@/hooks/useNotify';

export const DemandFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== 'new';

  const [formData, setFormData] = useState<CreateDemandRequest>({
    name: '',
    introduction: '',
    location: '',
    publicSummary: '',
    published: false,
  });
  // 附件：檔案 id 與顯示用檔名（依顯示順序）
  const [attachments, setAttachments] = useState<{ fileId: string; name: string }[]>([]);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<CompanyTagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [notifyCompanyIds, setNotifyCompanyIds] = useState<string[]>([]);
  const [showProTrackModal, setShowProTrackModal] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showNotificationProgress, setShowNotificationProgress] = useState(false);
  const [publishedDemandId, setPublishedDemandId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const options = await demandsApi.getTagOptions();
        setAvailableTags(options);

        if (isEditMode) {
          const data = await demandsApi.getDemandById(id!);
          setFormData({
            name: data.name,
            introduction: data.introduction,
            location: data.location ?? '',
            publicSummary: data.publicSummary ?? '',
            companyId: data.companyId,
            published: data.published,
          });
          setAttachments((data.attachments ?? []).map((a) => ({ fileId: a.fileId, name: `${a.fileName}（${a.formattedFileSize}）` })));
          const bound = await demandsApi.getDemandTags(id!);
          setSelectedTagIds(bound.tagIds ?? []);
        }
      } catch (error) {
        console.error('Failed to load demand form:', error);
        await notify.error('載入需求失敗');
        if (isEditMode) navigate('/demands');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

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

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入需求名稱');
      return;
    }

    setIsSaving(true);
    try {
      let savedId: string;
      if (isEditMode) {
        // 先存標籤，再發布（發布時後端會查標籤決定通知對象）
        await demandsApi.setDemandTags(id!, selectedTagIds);
        const updateData: UpdateDemandRequest = {
          name: formData.name,
          introduction: formData.introduction,
          location: formData.location ?? '',
          publicSummary: formData.publicSummary ?? '',
          attachmentFileIds: attachments.map((a) => a.fileId),
          published: publish,
          notifyCompanyIds: publish ? notifyCompanyIds : undefined,
        };
        await demandsApi.updateDemand(id!, updateData);
        savedId = id!;
      } else {
        const createData: CreateDemandRequest = {
          ...formData,
          attachmentFileIds: attachments.map((a) => a.fileId),
          published: false, // 先建草稿
        };
        const created = await demandsApi.createDemand(createData);
        if (selectedTagIds.length > 0) {
          await demandsApi.setDemandTags(created.id, selectedTagIds);
        }
        // 再切換發布狀態（此時標籤已存在，通知才能正確觸發）
        if (publish) {
          await demandsApi.updateDemand(created.id, {
            published: true,
            notifyCompanyIds,
          });
        }
        savedId = created.id;
      }

      if (publish) {
        setPublishedDemandId(savedId);
        setShowNotificationProgress(true);
      } else {
        navigate('/demands');
      }
    } catch (error) {
      console.error('Failed to save demand:', error);
      await notify.error('儲存需求失敗，請稍後再試');
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
      {notify.NotifyComponent}

      <DemandNotificationProgressModal
        open={showNotificationProgress}
        demandId={publishedDemandId ?? ''}
        onClose={() => { setShowNotificationProgress(false); navigate('/demands'); }}
      />

      <DemandEmailPreviewModal
        open={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
        demandName={formData.name}
        demandIntroduction={formData.introduction ?? ''}
        tagNames={availableTags.filter((t) => selectedTagIds.includes(t.id)).map((t) => t.name)}
      />

      <ProTrackImportModal
        open={showProTrackModal}
        onClose={() => setShowProTrackModal(false)}
        onImport={(result) => {
          setFormData((prev) => ({
            ...prev,
            name: result.suggestedName || prev.name,
            introduction: result.suggestedIntroduction || prev.introduction,
            companyId: result.matchedCompanyId ?? prev.companyId,
          }));
          if (result.suggestedTagIds.length > 0) {
            setSelectedTagIds((prev) => Array.from(new Set([...prev, ...result.suggestedTagIds])));
            void notify.success(`已自動帶入標籤：${result.suggestedTagNames.join('、')}`);
          }
        }}
      />

      <PageTitle
        title={isEditMode ? '編輯需求' : '新增需求'}
        items={[
          { label: '需求張貼管理', path: '/demands' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <button
          type="button"
          className="btn btn-outline btn-info btn-sm"
          onClick={() => setShowProTrackModal(true)}
        >
          <span className="iconify lucide--file-input size-4" />
          導入需求
        </button>
      </div>

      <form>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-6">
              <span className="iconify lucide--file-edit size-6" />
              需求資訊
            </h2>

            <div className="space-y-6">
              {/* 需求名稱 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    需求名稱 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例如：尋找 PE 樹脂供應商"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* 需求介紹 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">需求介紹</span>
                  <span className="label-text-alt text-base-content/60">
                    詳細說明您的需求內容
                  </span>
                </label>
                <textarea
                  placeholder="請詳細描述您的需求，包括產品規格、數量、品質要求等..."
                  className="textarea textarea-bordered h-40"
                  value={formData.introduction}
                  onChange={(e) =>
                    setFormData({ ...formData, introduction: e.target.value })
                  }
                />
                <label className="label">
                  <span className="label-text-alt">
                    {formData.introduction?.length || 0} 字
                  </span>
                </label>
              </div>

              {/* 地點、公開摘要、附件：前台媒合對接頁顯示 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">地點</span>
                  <span className="label-text-alt text-base-content/60">前台列表與詳情顯示，例如「高雄市小港區」</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  maxLength={100}
                  value={formData.location ?? ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">公開摘要</span>
                  <span className="label-text-alt text-base-content/60">所有訪客都看得到；不填就用需求介紹開頭 120 字</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  maxLength={500}
                  placeholder="例如：專注於提供企業數位轉型與智慧工安解決方案…"
                  value={formData.publicSummary ?? ''}
                  onChange={(e) => setFormData({ ...formData, publicSummary: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">附件</span>
                  <span className="label-text-alt text-base-content/60">只有登入的企業會員看得到、可下載；最多 10 個</span>
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

              <div className="divider" />

              {/* 需求標籤 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <span className="iconify lucide--tags size-4" />
                    需求標籤
                    {selectedTagIds.length > 0 && (
                      <span className="badge badge-primary badge-sm">{selectedTagIds.length}</span>
                    )}
                  </span>
                  <span className="label-text-alt text-base-content/60">可多選，任一層皆可勾選</span>
                </label>
                <TagCategoryTreeSelect
                  options={availableTags}
                  selectedIds={selectedTagIds}
                  onToggle={toggleTag}
                  emptyText="尚無可用的標籤"
                />
              </div>

              {/* 相似供給端業者 */}
              <SimilarCompaniesPanel
                tagIds={selectedTagIds}
                demandId={isEditMode ? id : undefined}
                previewName={formData.name}
                previewIntroduction={formData.introduction}
                onSelectionChange={setNotifyCompanyIds}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline btn-sm gap-2"
                  onClick={() => setShowEmailPreview(true)}
                >
                  <span className="iconify lucide--mail size-4" />
                  預覽通知信
                </button>
              </div>

              <div className="divider" />

              {/* 提示資訊 */}
              <div className="alert alert-info">
                <span className="iconify lucide--info size-5" />
                <div>
                  <h4 className="font-bold">發布說明</h4>
                  <div className="text-sm mt-1">
                    • 儲存為草稿：僅保存內容，不會公開顯示
                    <br />• 立即發布：需求將公開在平台上，並自動寄送媒合通知給標籤相符的供給端業者
                  </div>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleSubmit(e, false)}
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
                  type="submit"
                  onClick={(e) => handleSubmit(e, true)}
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
      </form>

      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={(file) => void handleAttachmentPick(file)}
        fileType="all"
        title="選擇需求附件"
      />
    </div>
  );
};
