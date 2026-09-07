import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useConfirm } from '@/hooks/useConfirm';

import type { BannerResponse, CreateBannerRequest, UpdateBannerRequest } from '@/types/banner';
import { bannerApi } from '@/lib/api/banner';
import { useNotify } from '@/hooks/useNotify';

const isVideoContentType = (contentType?: string): boolean => {
  return contentType?.startsWith('video/') ?? false;
};

const getContentTypeFromUri = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '')) return `video/${ext === 'mov' ? 'quicktime' : ext}`;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return '';
};

export const BannersPage = () => {
  const notify = useNotify();
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 檔案選擇器狀態
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  const { confirmDialog, ConfirmComponent } = useConfirm();

  const [formData, setFormData] = useState<CreateBannerRequest>({
    name: '',
    uri: '',
    linkUrl: '',
    linkTarget: '_self',
    remark: '',
    contentType: '',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const data = await bannerApi.getPaged();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (banner?: BannerResponse) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        name: banner.name || '',
        uri: banner.uri || '',
        linkUrl: banner.linkUrl || '',
        linkTarget: banner.linkTarget || '_self',
        remark: banner.remark || '',
        positionId: banner.positionId,
        contentType: banner.contentType || ''
      });
    } else {
      setEditingBanner(null);
      setFormData({
        name: '',
        uri: '',
        linkUrl: '',
        linkTarget: '_self',
        remark: '',
        contentType: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleFileSelect = (file: FileListItem | FileUploadResponse) => {
    const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
    // 優先用檔案本身的 contentType，其次用副檔名推斷
    let contentType = file.contentType;
    if (!contentType && 'fileExtension' in file && file.fileExtension) {
      contentType = getContentTypeFromUri(`file.${file.fileExtension.replace(/^\./, '')}`);
    }
    contentType = contentType || getContentTypeFromUri(fileUrl);

    setFormData({
      ...formData,
      uri: fileUrl,
      contentType: contentType,
    });
    setIsFilePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入橫幅標題');
      return;
    }

    // 自動偵測內容類型
    const contentType = formData.contentType || getContentTypeFromUri(formData.uri);

    setIsSaving(true);
    try {
      if (editingBanner) {
        const updateData: UpdateBannerRequest = {
          ...formData,
          contentType,
        };
        await bannerApi.update(editingBanner.id, updateData);
      } else {
        await bannerApi.create({
          ...formData,
          contentType,
        });
      }
      handleCloseModal();
      fetchBanners();
    } catch (error) {
      console.error('Failed to save banner:', error);
      await notify.error('儲存橫幅失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除橫幅', message: '確定要刪除此橫幅嗎？', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await bannerApi.delete(id);
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      await notify.error('刪除橫幅失敗');
    }
  };

  const renderMediaPreview = (uri?: string, contentType?: string, className?: string) => {
    if (!uri) return null;

    const isVideo = isVideoContentType(contentType) || ['mp4', 'webm', 'ogg', 'mov'].some(ext => uri.toLowerCase().endsWith(`.${ext}`));

    if (isVideo) {
      return (
        <video
          src={uri}
          className={className || 'w-full h-full object-cover'}
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      );
    }

    return (
      <img
        src={uri}
        alt="預覽"
        className={className || 'w-full h-full object-cover'}
      />
    );
  };

  return (
    <>
    <div className="space-y-6 min-h-screen">
      <PageTitle
        title="橫幅管理"
        items={[
          { label: '內容管理', path: '/content/banners' },
          { label: '橫幅管理', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{banners.length}</span> 個橫幅
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增橫幅
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--image size-16 mb-4" />
              <p>尚未建立任何橫幅</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex gap-4">
                      <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-base-300">
                        {renderMediaPreview(banner.uri, banner.contentType)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{banner.name}</h3>
                        {banner.remark && (
                          <p className="text-sm text-base-content/70 mb-2">{banner.remark}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-base-content/60">
                          {/* 內容類型標籤 */}
                          <span className="badge badge-outline">
                            {isVideoContentType(banner.contentType) ? (
                              <>
                                <span className="iconify lucide--video size-3 mr-1" />
                                影片
                              </>
                            ) : (
                              <>
                                <span className="iconify lucide--image size-3 mr-1" />
                                圖片
                              </>
                            )}
                          </span>

                          {/* 連結資訊 */}
                          {banner.linkUrl && (
                            <span className="badge badge-outline">
                              <span className="iconify lucide--link size-3 mr-1" />
                              {banner.linkTarget === '_blank' ? '開新視窗' : '原視窗'}
                            </span>
                          )}

                          <span className="badge badge-ghost gap-1">
                             <span className="iconify lucide--eye size-3" />
                             {banner.viewCount} 次瀏覽
                          </span>
                          <span className="badge badge-ghost gap-1">
                             <span className="iconify lucide--mouse-pointer size-3" />
                             {banner.clickCount} 次點擊
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenModal(banner)}
                          className="btn btn-sm btn-neutral"
                        >
                          <span className="iconify lucide--edit size-4" />
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="btn btn-sm btn-error"
                        >
                          <span className="iconify lucide--trash-2 size-4" />
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingBanner ? '編輯橫幅' : '新增橫幅'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      橫幅標題 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：歡迎來到智慧石化產業平台"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* 圖片/影片選擇 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      圖片/影片
                    </span>
                  </label>

                  {/* 預覽區域 */}
                  {formData.uri && (
                    <div className="mb-3 relative">
                      <div className="w-full h-48 rounded-lg overflow-hidden bg-base-200">
                        {renderMediaPreview(formData.uri, formData.contentType, 'w-full h-full object-contain')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, uri: '', contentType: '' })}
                        className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                      >
                        <span className="iconify lucide--x size-4" />
                      </button>
                    </div>
                  )}

                  {/* 選擇方式 */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFilePickerOpen(true)}
                      className="btn btn-neutral flex-1"
                    >
                      <span className="iconify lucide--folder-open size-4" />
                      從檔案系統選擇
                    </button>
                  </div>

                  {/* 或手動輸入 URL */}
                  <div className="divider text-xs text-base-content/50">或手動輸入網址</div>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="input input-bordered"
                    value={formData.uri}
                    onChange={(e) => setFormData({
                      ...formData,
                      uri: e.target.value,
                      contentType: getContentTypeFromUri(e.target.value)
                    })}
                  />
                </div>

                {/* 連結設定 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">連結設定</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">
                        <span className="label-text text-sm">連結網址</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/page"
                        className="input input-bordered w-full"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text text-sm">開啟方式</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={formData.linkTarget}
                        onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value as '_blank' | '_self' })}
                        disabled={!formData.linkUrl}
                      >
                        <option value="_self">原視窗開啟</option>
                        <option value="_blank">開啟新視窗</option>
                      </select>
                    </div>
                  </div>
                  {!formData.linkUrl && (
                    <p className="text-xs text-base-content/50 mt-1">
                      輸入連結網址後可選擇開啟方式
                    </p>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">備註</span>
                  </label>
                  <textarea
                    placeholder="橫幅的備註..."
                    className="textarea textarea-bordered h-24"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                      <span className="iconify lucide--save size-4" />
                      {editingBanner ? '儲存' : '新增'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={handleCloseModal} />
        </div>
      )}

      {/* 檔案選擇器 Modal */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={handleFileSelect}
        fileType="all"
        title="選擇橫幅圖片或影片"
      />
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
