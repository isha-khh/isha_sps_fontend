/* eslint-disable react-hooks/set-state-in-effect -- 直接照抄 SPS.AdminWeb 那份能動的檔案，
   是後台編輯用的檔案選擇 modal，Puck 內容渲染（PuckRenderer 走的是 Render，不是 Puck
   編輯器本體）不會用到這支，公開網站這邊也還沒有任何地方真的呼叫它——先不要動它的
   effect 邏輯冒風險改壞，等真的要在這個專案做檔案管理/上傳功能時再回頭處理。 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { filesManagementApi, type FileQueryParameters } from '@/lib/api/files-management';
import type { FileListItem, FileUploadResponse } from '@/types/files';

export type FileFilterType = 'all' | 'image' | 'video' | 'document';

export interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FileListItem | FileUploadResponse) => void;
  fileType?: FileFilterType;
  multiple?: boolean;
  title?: string;
}

const getFileTypeFilter = (type: FileFilterType): string | undefined => {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'document':
      return 'document';
    default:
      return undefined;
  }
};

const isImageFile = (contentType: string): boolean => {
  return contentType.startsWith('image/');
};

const isVideoFile = (contentType: string): boolean => {
  return contentType.startsWith('video/');
};

const getFileIcon = (contentType: string, extension: string): string => {
  if (isImageFile(contentType)) return 'lucide--image';
  if (isVideoFile(contentType)) return 'lucide--video';
  if (contentType === 'application/pdf') return 'lucide--file-text';
  if (extension === '.doc' || extension === '.docx') return 'lucide--file-text';
  if (extension === '.xls' || extension === '.xlsx') return 'lucide--file-spreadsheet';
  if (extension === '.ppt' || extension === '.pptx') return 'lucide--file-presentation';
  if (extension === '.zip' || extension === '.rar' || extension === '.7z') return 'lucide--file-archive';
  return 'lucide--file';
};

const getFileUrl = (file: FileListItem): string => {
  // 組合檔案 URL
  return `/api/FileManagement/${file.id}/download`;
};

export const FilePickerModal = ({
  isOpen,
  onClose,
  onSelect,
  fileType = 'all',
  multiple = false,
  title = '選擇檔案',
}: FilePickerModalProps) => {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<FileListItem[]>([]);

  // 上傳相關狀態
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 12;

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FileQueryParameters = {
        pageIndex: currentPage,
        pageSize,
        keyword: searchKeyword || undefined,
        fileType: getFileTypeFilter(fileType),
      };

      const response = await filesManagementApi.queryFiles(params);
      setFiles(response.items || []);
      setTotalPages(Math.ceil((response.totalCount || 0) / pageSize));
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchKeyword, fileType]);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, fetchFiles]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setSearchKeyword('');
      setCurrentPage(1);
      setUploadError(null);
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFiles();
  };

  const handleFileClick = (file: FileListItem) => {
    if (multiple) {
      setSelectedFiles((prev) => {
        const isSelected = prev.some((f) => f.id === file.id);
        if (isSelected) {
          return prev.filter((f) => f.id !== file.id);
        }
        return [...prev, file];
      });
    } else {
      onSelect(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (selectedFiles.length > 0) {
      // 對於多選，只傳第一個（可根據需求調整）
      onSelect(selectedFiles[0]);
      onClose();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證檔案類型
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      setUploadError('請選擇圖片檔案');
      return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      setUploadError('請選擇影片檔案');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await filesManagementApi.uploadFile(
        {
          file,
          description: `上傳於檔案選擇器: ${file.name}`,
          isPublic: true,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // 上傳成功後，直接選擇這個檔案
      onSelect(response);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getAcceptTypes = (): string => {
    switch (fileType) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'document':
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      default:
        return '*';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <span className="iconify lucide--x size-5" />
          </button>
        </div>

        {/* Search and Upload */}
        <div className="flex gap-2 mb-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="搜尋檔案名稱..."
              className="input input-bordered flex-1"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn-neutral">
              <span className="iconify lucide--search size-4" />
              搜尋
            </button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="btn btn-success"
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
                上傳新檔案
              </>
            )}
          </button>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="alert alert-error mb-4">
            <span className="iconify lucide--alert-circle size-4" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* File Type Filter Indicator */}
        {fileType !== 'all' && (
          <div className="mb-4">
            <span className="badge badge-outline">
              {fileType === 'image' && '僅顯示圖片'}
              {fileType === 'video' && '僅顯示影片'}
              {fileType === 'document' && '僅顯示文件'}
            </span>
          </div>
        )}

        {/* File Grid */}
        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--folder-open size-16 mb-4" />
              <p>沒有找到檔案</p>
              <p className="text-sm mt-2">請嘗試其他搜尋條件或上傳新檔案</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((file) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                const isImage = isImageFile(file.contentType);
                const isVideo = isVideoFile(file.contentType);

                return (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className={`
                      card bg-base-200 cursor-pointer transition-all hover:shadow-md
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    <figure className="h-24 bg-base-300 relative overflow-hidden">
                      {isImage ? (
                        <img
                          src={getFileUrl(file)}
                          alt={file.originalFileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : isVideo ? (
                        <div className="flex items-center justify-center h-full w-full bg-base-300">
                          <span className="iconify lucide--video size-10 text-base-content/40" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full w-full">
                          <span className={`iconify ${getFileIcon(file.contentType, file.fileExtension)} size-10 text-base-content/40`} />
                        </div>
                      )}

                      {/* Selection Indicator */}
                      {multiple && isSelected && (
                        <div className="absolute top-1 right-1">
                          <span className="iconify lucide--check-circle size-5 text-primary" />
                        </div>
                      )}
                    </figure>
                    <div className="card-body p-2">
                      <p className="text-xs font-medium line-clamp-2" title={file.originalFileName}>
                        {file.originalFileName}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {file.formattedFileSize}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <div className="join">
              <button
                className="join-item btn btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <span className="iconify lucide--chevron-left size-4" />
              </button>
              <button className="join-item btn btn-sm">
                {currentPage} / {totalPages}
              </button>
              <button
                className="join-item btn btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <span className="iconify lucide--chevron-right size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            取消
          </button>
          {multiple && (
            <button
              onClick={handleConfirmSelection}
              className="btn btn-primary"
              disabled={selectedFiles.length === 0}
            >
              確認選擇 ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default FilePickerModal;
