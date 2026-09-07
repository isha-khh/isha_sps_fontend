import { useState, useEffect, useRef } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { filesManagementApi } from '@/lib/api/files-management';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useConfirm } from '@/hooks/useConfirm';

import type { AlbumResponse, CreateAlbumRequest, UpdateAlbumRequest } from '@/types/album';
import type { PictureResponse, CreatePictureRequest } from '@/types/picture';
import { albumApi } from '@/lib/api/album';
import { picturesApi } from '@/lib/api/pictures';
import { useNotify } from '@/hooks/useNotify';

export const AlbumsPage = () => {
  const notify = useNotify();
  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 相簿圖片查看
  const [viewingAlbum, setViewingAlbum] = useState<AlbumResponse | null>(null);
  const [albumImages, setAlbumImages] = useState<PictureResponse[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // 圖片上傳相關狀態
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 檔案選擇器狀態
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  const [formData, setFormData] = useState<CreateAlbumRequest>({
    title: '',
    published: false,
    ordinal: 0,
  });

  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    void fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const data = await albumApi.getPaged();
      setAlbums(data);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId: number) => {
    setIsLoadingImages(true);
    try {
      const images = await picturesApi.getByAlbumId(albumId);
      setAlbumImages(images);
    } catch (error) {
      console.error('Failed to fetch album images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleOpenModal = (album?: AlbumResponse) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        title: album.title || '',
        published: album.published,
        ordinal: album.ordinal,
        coverId: album.coverId,
        number: album.number,
        startDate: album.startDate,
        endDate: album.endDate
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        title: '',
        published: false,
        ordinal: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlbum(null);
  };

  const handleViewAlbum = async (album: AlbumResponse) => {
    setViewingAlbum(album);
    await fetchAlbumImages(album.id);
  };

  const handleCloseViewModal = () => {
    setViewingAlbum(null);
    setAlbumImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      await notify.warning('請輸入相簿名稱');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAlbum) {
        const updateData: UpdateAlbumRequest = formData;
        await albumApi.update(editingAlbum.id, updateData);
      } else {
        await albumApi.create(formData);
      }
      handleCloseModal();
      await fetchAlbums();
    } catch (error) {
      console.error('Failed to save album:', error);
      await notify.error('儲存相簿失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除相簿', message: '確定要刪除此相簿嗎？相簿內的所有圖片也會一併刪除。', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await albumApi.delete(id);
      await fetchAlbums();
    } catch (error) {
      console.error('Failed to delete album:', error);
      await notify.error('刪除相簿失敗');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除圖片', message: '確定要刪除此圖片嗎？', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await picturesApi.delete(imageId);
      if (viewingAlbum) {
        await fetchAlbumImages(viewingAlbum.id);
        await fetchAlbums(); // 更新相簿圖片數量
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      await notify.error('刪除圖片失敗');
    }
  };

  // 設定為封面
  const handleSetCover = async (pictureId: number) => {
    if (!viewingAlbum) return;

    try {
      await albumApi.update(viewingAlbum.id, {
        coverId: pictureId,
      });
      await fetchAlbums();
      // 更新當前查看的相簿資訊
      const updatedAlbum = albums.find(a => a.id === viewingAlbum.id);
      if (updatedAlbum) {
        setViewingAlbum({ ...viewingAlbum, coverId: pictureId });
      }
      await notify.success('封面設定成功');
    } catch (error) {
      console.error('Failed to set cover:', error);
      await notify.error('設定封面失敗');
    }
  };

  // 從檔案選擇器選擇圖片
  const handleFileSelect = async (file: FileListItem | FileUploadResponse) => {
    if (!viewingAlbum) return;

    const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
    const fileName = 'fileName' in file ? file.fileName : ('originalFileName' in file ? file.originalFileName : '未命名');
    const contentType = file.contentType || 'image/jpeg';

    try {
      const createRequest: CreatePictureRequest = {
        name: fileName,
        uri: fileUrl,
        contentType: contentType,
        albumId: viewingAlbum.id,
        published: true,
        ordinal: albumImages.length + 1,
        type: 1, // 一般圖片
        height: 0,
        width: 0,
        dpi: 72,
      };

      await picturesApi.create(createRequest);
      await fetchAlbumImages(viewingAlbum.id);
      await fetchAlbums();
      setIsFilePickerOpen(false);
    } catch (error) {
      console.error('Failed to add picture to album:', error);
      await notify.error('新增圖片失敗');
    }
  };

  // 直接上傳檔案到相簿
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !viewingAlbum) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let completed = 0;

      for (const file of Array.from(files)) {
        // 驗證檔案類型
        if (!file.type.startsWith('image/')) {
          console.warn(`跳過非圖片檔案: ${file.name}`);
          continue;
        }

        // 上傳到檔案系統
        const uploadResponse = await filesManagementApi.uploadFile(
          {
            file,
            description: `相簿圖片: ${viewingAlbum.title}`,
            isPublic: true,
          },
          (progress) => {
            const overallProgress = Math.round(((completed + progress / 100) / totalFiles) * 100);
            setUploadProgress(overallProgress);
          }
        );

        // 建立圖片記錄關聯到相簿
        const createRequest: CreatePictureRequest = {
          name: file.name,
          uri: uploadResponse.fileUrl,
          contentType: uploadResponse.contentType,
          albumId: viewingAlbum.id,
          published: true,
          ordinal: albumImages.length + completed + 1,
          type: 1,
          height: 0,
          width: 0,
          dpi: 72,
        };

        await picturesApi.create(createRequest);
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }

      await fetchAlbumImages(viewingAlbum.id);
      await fetchAlbums();
    } catch (error) {
      console.error('Failed to upload images:', error);
      await notify.error('上傳圖片失敗');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
    <div className=" grow p-4 md:p-6 min-h-screen flex flex-col">
      <PageTitle
        title="相簿管理"
        items={[
          { label: '內容管理', path: '/content/albums' },
          { label: '相簿管理', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{albums.length}</span> 個相簿
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增相簿
          </button>
        </div>

      {/* 相簿網格 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : albums.length === 0 ? (
          <div className="col-span-full text-center py-12 text-base-content/60">
            <span className="iconify lucide--images size-16 mb-4" />
            <p>尚未建立任何相簿</p>
          </div>
        ) : (
          albums.map((album) => (
            <div key={album.id} className="card bg-base-100 shadow">
              <figure className="h-48 bg-base-200">
                {album.coverUri ? (
                  <img
                    src={album.coverUri}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="iconify lucide--image size-16 text-base-content/20" />
                  </div>
                )}
              </figure>
              <div className="card-body">
                <h2 className="card-title">{album.title}</h2>
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <span className="iconify lucide--images size-4" />
                  <span>{album.pictureCount} 張照片</span>
                  {album.published ? (
                    <span className="badge badge-success badge-sm ml-auto">已發布</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm ml-auto">未發布</span>
                  )}
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => handleViewAlbum(album)}
                    className="btn btn-sm btn-neutral"
                  >
                    <span className="iconify lucide--eye size-4" />
                    查看
                  </button>
                  <button
                    onClick={() => handleOpenModal(album)}
                    className="btn btn-sm btn-ghost"
                  >
                    <span className="iconify lucide--edit size-4" />
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(album.id)}
                    className="btn btn-sm btn-ghost text-error"
                  >
                    <span className="iconify lucide--trash-2 size-4" />
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新增/編輯相簿 Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingAlbum ? '編輯相簿' : '新增相簿'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      相簿名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：2024 石化產業高峰論壇"
                    className="input input-bordered"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text font-medium">發布此相簿</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({ ...formData, published: e.target.checked })
                      }
                    />
                  </label>
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
                      {editingAlbum ? '儲存' : '新增'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={handleCloseModal} />
        </div>
      )}

      {/* 查看相簿圖片 Modal */}
      {viewingAlbum && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{viewingAlbum.title}</h3>
              <div className="flex gap-2">
                {/* 隱藏的檔案上傳 input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* 上傳按鈕 */}
                <button
                  onClick={handleUploadClick}
                  className="btn btn-success btn-sm"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <span className="iconify lucide--upload size-4" />
                      上傳圖片
                    </>
                  )}
                </button>

                {/* 從檔案系統選擇 */}
                <button
                  onClick={() => setIsFilePickerOpen(true)}
                  className="btn btn-neutral btn-sm"
                  disabled={isUploading}
                >
                  <span className="iconify lucide--folder-open size-4" />
                  從檔案選擇
                </button>
              </div>
            </div>

            {isLoadingImages ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : albumImages.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <span className="iconify lucide--image size-16 mb-4" />
                <p>此相簿尚無照片</p>
                <p className="text-sm mt-2">點擊上方按鈕上傳或選擇圖片</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-[60vh] overflow-y-auto">
                {albumImages.map((image) => {
                  const isCover = viewingAlbum.coverId === image.id;
                  return (
                    <div key={image.id} className={`card bg-base-200 ${isCover ? 'ring-2 ring-primary' : ''}`}>
                      <figure className="h-32 relative">
                        <img
                          src={image.thumbnailUri || image.uri}
                          alt={image.name || ''}
                          className="w-full h-full object-cover"
                        />
                        {isCover && (
                          <div className="absolute top-2 left-2">
                            <span className="badge badge-primary badge-sm">
                              <span className="iconify lucide--star size-3 mr-1" />
                              封面
                            </span>
                          </div>
                        )}
                      </figure>
                      <div className="card-body p-3">
                        {image.name && (
                          <div className="text-sm font-semibold line-clamp-1">{image.name}</div>
                        )}
                        {image.remark && (
                          <div className="text-xs text-base-content/60 line-clamp-2">
                            {image.remark}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          {!isCover && (
                            <button
                              onClick={() => handleSetCover(image.id)}
                              className="btn btn-xs btn-ghost"
                              title="設為封面"
                            >
                              <span className="iconify lucide--star size-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="btn btn-xs btn-ghost text-error"
                          >
                            <span className="iconify lucide--trash-2 size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-action">
              <button onClick={handleCloseViewModal} className="btn btn-ghost">
                關閉
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleCloseViewModal} />
        </div>
      )}

      {/* 檔案選擇器 Modal */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={handleFileSelect}
        fileType="image"
        title="選擇圖片加入相簿"
      />
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
