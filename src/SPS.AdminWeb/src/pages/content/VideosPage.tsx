import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useConfirm } from '@/hooks/useConfirm';

import type { VideoResponse, CreateVideoRequest, UpdateVideoRequest } from '@/types/video';
import type { AlbumResponse } from '@/types/album';
import { videosApi } from '@/lib/api/videos';
import { albumApi } from '@/lib/api/album';
import { useNotify } from '@/hooks/useNotify';

const getContentTypeFromUri = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '')) return `video/${ext === 'mov' ? 'quicktime' : ext}`;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return '';
};

const emptyFormData: CreateVideoRequest = {
  name: '',
  uri: '',
  thumbnailUri: '',
  linkUrl: '',
  contentType: '',
  playOnSite: true,
  published: false,
  ordinal: 0,
  height: 0,
  width: 0,
  dpi: 0,
  remark: '',
  albumId: undefined,
};

export const VideosPage = () => {
  const notify = useNotify();
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 檔案選擇器狀態——影片本體跟縮圖是兩個獨立欄位，各自要有自己的
  // 選檔器開關，不能共用一個（跟 BannersPage 只有單一媒體欄位不同）
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isThumbnailPickerOpen, setIsThumbnailPickerOpen] = useState(false);

  const { confirmDialog, ConfirmComponent } = useConfirm();

  const [formData, setFormData] = useState<CreateVideoRequest>(emptyFormData);

  useEffect(() => {
    fetchVideos();
    fetchAlbums();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await videosApi.getPaged();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const data = await albumApi.getPaged(1, 100);
      setAlbums(data);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const handleOpenModal = (video?: VideoResponse) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        name: video.name || '',
        uri: video.uri || '',
        thumbnailUri: video.thumbnailUri || '',
        linkUrl: video.linkUrl || '',
        contentType: video.contentType || '',
        playOnSite: video.playOnSite,
        published: video.published,
        ordinal: video.ordinal,
        height: video.height,
        width: video.width,
        dpi: video.dpi,
        remark: video.remark || '',
        albumId: video.albumId,
      });
    } else {
      setEditingVideo(null);
      setFormData(emptyFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const resolveFileUrl = (file: FileListItem | FileUploadResponse): string =>
    'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;

  const handleVideoFileSelect = (file: FileListItem | FileUploadResponse) => {
    const fileUrl = resolveFileUrl(file);
    let contentType = file.contentType;
    if (!contentType && 'fileExtension' in file && file.fileExtension) {
      contentType = getContentTypeFromUri(`file.${file.fileExtension.replace(/^\./, '')}`);
    }
    setFormData({ ...formData, uri: fileUrl, contentType: contentType || getContentTypeFromUri(fileUrl) });
    setIsFilePickerOpen(false);
  };

  const handleThumbnailFileSelect = (file: FileListItem | FileUploadResponse) => {
    setFormData({ ...formData, thumbnailUri: resolveFileUrl(file) });
    setIsThumbnailPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入影片名稱');
      return;
    }
    if (!formData.uri.trim()) {
      await notify.warning('請選擇影片檔案或輸入影片網址');
      return;
    }

    const contentType = formData.contentType || getContentTypeFromUri(formData.uri);

    setIsSaving(true);
    try {
      if (editingVideo) {
        const updateData: UpdateVideoRequest = { ...formData, contentType };
        await videosApi.update(editingVideo.id, updateData);
      } else {
        await videosApi.create({ ...formData, contentType });
      }
      handleCloseModal();
      fetchVideos();
    } catch (error) {
      console.error('Failed to save video:', error);
      await notify.error('儲存影片失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除影片', message: '確定要刪除此影片嗎？', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await videosApi.delete(id);
      fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      await notify.error('刪除影片失敗');
    }
  };

  return (
    <>
    <div className="space-y-6 min-h-screen">
      <PageTitle
        title="影音管理"
        items={[
          { label: '內容管理', path: '/content/videos' },
          { label: '影音管理', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{videos.length}</span> 支影片
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增影片
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--video size-16 mb-4" />
              <p>尚未建立任何影片</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div key={video.id} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex gap-4">
                      <div className="w-48 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-base-300">
                        {video.thumbnailUri ? (
                          <img src={video.thumbnailUri} alt="縮圖" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="iconify lucide--video size-8 text-base-content/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{video.name}</h3>
                        {video.remark && (
                          <p className="text-sm text-base-content/70 mb-2">{video.remark}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-base-content/60">
                          <span className={`badge ${video.published ? 'badge-success' : 'badge-ghost'}`}>
                            {video.published ? '已發布' : '未發布'}
                          </span>
                          <span className={`badge ${video.playOnSite ? 'badge-info' : 'badge-outline'}`}>
                            <span className={`iconify size-3 mr-1 ${video.playOnSite ? 'lucide--monitor-play' : 'lucide--external-link'}`} />
                            {video.playOnSite ? '站內播放' : '導向來源'}
                          </span>
                          {video.albumTitle && (
                            <span className="badge badge-outline">
                              <span className="iconify lucide--folder size-3 mr-1" />
                              {video.albumTitle}
                            </span>
                          )}
                          {video.linkUrl && (
                            <span className="badge badge-outline">
                              <span className="iconify lucide--link size-3 mr-1" />
                              有外部連結
                            </span>
                          )}
                          <span className="badge badge-ghost gap-1">
                            <span className="iconify lucide--arrow-up-down size-3" />
                            排序 {video.ordinal}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenModal(video)}
                          className="btn btn-sm btn-neutral"
                        >
                          <span className="iconify lucide--edit size-4" />
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
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
              {editingVideo ? '編輯影片' : '新增影片'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      影片名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：ESG 永續發展實務：石化廠的碳盤查經驗分享"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* 影片檔案 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      影片檔案 <span className="text-error">*</span>
                    </span>
                  </label>

                  {formData.uri && (
                    <div className="mb-3 relative">
                      <video
                        src={formData.uri}
                        className="w-full h-48 rounded-lg bg-base-200 object-contain"
                        controls
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, uri: '', contentType: '' })}
                        className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                      >
                        <span className="iconify lucide--x size-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsFilePickerOpen(true)}
                    className="btn btn-neutral"
                  >
                    <span className="iconify lucide--folder-open size-4" />
                    從檔案系統選擇
                  </button>

                  <div className="divider text-xs text-base-content/50">或手動輸入網址</div>
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4 或 YouTube 內嵌網址"
                    className="input input-bordered"
                    value={formData.uri}
                    onChange={(e) => setFormData({
                      ...formData,
                      uri: e.target.value,
                      contentType: getContentTypeFromUri(e.target.value),
                    })}
                  />
                </div>

                {/* 縮圖 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">縮圖</span>
                  </label>

                  {formData.thumbnailUri && (
                    <div className="mb-3 relative">
                      <div className="w-full h-40 rounded-lg overflow-hidden bg-base-200">
                        <img src={formData.thumbnailUri} alt="縮圖預覽" className="w-full h-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnailUri: '' })}
                        className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                      >
                        <span className="iconify lucide--x size-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsThumbnailPickerOpen(true)}
                    className="btn btn-neutral"
                  >
                    <span className="iconify lucide--folder-open size-4" />
                    從檔案系統選擇
                  </button>

                  <div className="divider text-xs text-base-content/50">或手動輸入網址</div>
                  <input
                    type="text"
                    placeholder="https://example.com/thumbnail.jpg"
                    className="input input-bordered"
                    value={formData.thumbnailUri}
                    onChange={(e) => setFormData({ ...formData, thumbnailUri: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">連結網址（例如 YouTube 頁面）</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      className="input input-bordered w-full"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">所屬相簿</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.albumId ?? ''}
                      onChange={(e) => setFormData({ ...formData, albumId: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">未歸類</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>{album.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">排序（數字越小越前面）</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={formData.ordinal}
                      onChange={(e) => setFormData({ ...formData, ordinal: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text font-medium">發布此影片</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={formData.published}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text font-medium">網站內播放（燈箱嵌入）</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-info"
                      checked={formData.playOnSite}
                      onChange={(e) => setFormData({ ...formData, playOnSite: e.target.checked })}
                    />
                  </label>
                  <p className="text-xs text-base-content/50 mt-1">
                    開啟：點下去在頁面內嵌入播放（YouTube／Vimeo 等）。關閉：直接開新分頁導向「連結網址」或「影片檔案」的原始來源——正式環境的
                    CSP 還沒放行嵌入來源網域、或這支影片來源不允許被嵌入時，關掉這支影片的站內播放，不影響其他支影片。
                  </p>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">備註</span>
                  </label>
                  <textarea
                    placeholder="影片的備註..."
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
                      {editingVideo ? '儲存' : '新增'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={handleCloseModal} />
        </div>
      )}

      {/* 影片檔案選擇器 */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={handleVideoFileSelect}
        fileType="video"
        title="選擇影片檔案"
      />

      {/* 縮圖選擇器 */}
      <FilePickerModal
        isOpen={isThumbnailPickerOpen}
        onClose={() => setIsThumbnailPickerOpen(false)}
        onSelect={handleThumbnailFileSelect}
        fileType="image"
        title="選擇縮圖圖片"
      />
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
