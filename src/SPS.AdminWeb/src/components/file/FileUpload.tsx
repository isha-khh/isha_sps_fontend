import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  File,
  FileText,
  Film,
  Image,
  Loader2,
  Music,
  Pause,
  Play,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { type FileWithId, formatFileSize, useFileUpload } from '@/hooks/useFileUpload';
import { filesManagementApi } from '@/lib/api/files-management.ts';
import type { FileUploadResponse } from '@/types/files';

// Upload options interface matching your backend FileUploadRequest
export interface UploadOptions {
  description?: string;
  tags?: string;
  isPublic?: boolean;
  expiresAt?: string;
}

export interface UploadedFileInfo {
  fileId: string;
  fileNumber: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
}

// Props for the FileUpload component
export interface FileUploadProps {
  onFilesChange?: (files: UploadedFileInfo[]) => void;
  onFileRemove?: (fileId: string) => void;

  // Necessary parameters
  targetPath?: string;

  // Upload options
  uploadOptions?: UploadOptions;

  // Custom handlers
  onUpload?: (
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ) => Promise<FileUploadResponse>;
  onSuccess?: (response: FileUploadResponse, fileId: string) => void;
  onError?: (error: Error, fileId: string) => void;

  // File restrictions
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  minSize?: number;
  acceptedFileTypes?: string[];

  // Upload behavior
  autoUpload?: boolean;
  showUploadOptions?: boolean;

  // UI customization
  className?: string;
  labels?: Partial<UploadLabels>;
  showFileControls?: boolean;
  showFileDetails?: boolean;
  showSimpleFileTypes?: boolean;
  renderFileCard?: (
    file: FileWithId,
    actions: FileCardActions,
    uploadResult?: FileUploadResponse
  ) => React.ReactNode;
}

// Actions available for file cards
export interface FileCardActions {
  removeFile: () => void;
  pauseUpload: () => void;
  resumeUpload: () => void;
  downloadFile: () => void;
  previewFile: () => void;
}

export interface UploadLabels {
  dropzone: string;
  browse: string;
  maxFiles: string;
  maxSize: string;
  uploading: string;
  uploadOptions: string;
  description: string;
  tags: string;
  isPublic: string;
  overwrite: string;
}

// Default labels
const defaultLabels: UploadLabels = {
  dropzone: '將檔案拖放到此處',
  browse: '或點此夾帶檔案',
  maxFiles: '最大上傳文件數量:',
  maxSize: '最大上傳文件大小:',
  uploading: '上傳中...',
  uploadOptions: '上傳選項',
  description: '檔案描述',
  tags: '檔案標籤',
  isPublic: '公開訪問',
  overwrite: '覆蓋現有檔案',
};

// 檔案類型映射
const getSimpleFileTypeLabel = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'text/plain': '文字檔',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'audio/mpeg': 'MP3',
  };

  if (typeMap[mimeType]) return typeMap[mimeType];

  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase();
  if (mimeType.startsWith('video/')) return mimeType.split('/')[1].toUpperCase();
  if (mimeType.startsWith('audio/')) return mimeType.split('/')[1].toUpperCase();
  if (mimeType.includes('document')) return 'Office文件';
  if (mimeType.includes('text')) return '文字檔';

  return (mimeType.split('/')[1] || mimeType).toUpperCase();
};

// Group file types for display
const groupFileTypes = (types: string[], simple = false) => {
  const groups: Record<string, { icon: React.ReactNode; extensions: string[] }> = {
    image: {
      icon: (
        <span aria-label="圖片檔案類型">
          <Image aria-hidden="true" className="w-4 h-4" />
        </span>
      ),
      extensions: [],
    },
    document: {
      icon: (
        <span aria-label="文件檔案類型">
          <FileText aria-hidden="true" className="w-4 h-4" />
        </span>
      ),
      extensions: [],
    },
    video: {
      icon: (
        <span aria-label="影片檔案類型">
          <Film aria-hidden="true" className="w-4 h-4" />
        </span>
      ),
      extensions: [],
    },
    audio: {
      icon: (
        <span aria-label="音頻檔案類型">
          <Music aria-hidden="true" className="w-4 h-4" />
        </span>
      ),
      extensions: [],
    },
    other: {
      icon: (
        <span aria-label="其他檔案類型">
          <File aria-hidden="true" className="w-4 h-4" />
        </span>
      ),
      extensions: [],
    },
  };

  types.forEach((type) => {
    const extension = simple
      ? getSimpleFileTypeLabel(type)
      : type.split('/')[1]?.toUpperCase() || '';

    if (type.startsWith('image/')) {
      groups.image.extensions.push(extension);
    } else if (type.startsWith('video/')) {
      groups.video.extensions.push(extension);
    } else if (type.startsWith('audio/')) {
      groups.audio.extensions.push(extension);
    } else if (
      ['pdf', 'msword', 'vnd.openxmlformats-officedocument', 'text'].some((t) =>
        type.includes(t)
      )
    ) {
      groups.document.extensions.push(extension);
    } else {
      groups.other.extensions.push(extension);
    }
  });

  return Object.entries(groups).filter(([, group]) => group.extensions.length > 0);
};

const getFileTypeIcon = (type: string): React.ReactNode => {
  if (type.startsWith('image/'))
    return (
      <span aria-label="圖片檔案">
        <Image aria-hidden="true" className="w-5 h-5" />
      </span>
    );
  if (type.startsWith('video/'))
    return (
      <span aria-label="影片檔案">
        <Film aria-hidden="true" className="w-5 h-5" />
      </span>
    );
  if (type.startsWith('audio/'))
    return (
      <span aria-label="音頻檔案">
        <Music aria-hidden="true" className="w-5 h-5" />
      </span>
    );
  if (
    ['pdf', 'msword', 'vnd.openxmlformats-officedocument', 'text'].some((t) =>
      type.includes(t)
    )
  ) {
    return (
      <span aria-label="文件檔案">
        <FileText aria-hidden="true" className="w-5 h-5" />
      </span>
    );
  }
  return (
    <span aria-label="其他檔案">
      <File aria-hidden="true" className="w-5 h-5" />
    </span>
  );
};

const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'uploading':
      return (
        <span aria-label="上傳中">
          <Loader2 aria-hidden="true" className="w-5 h-5 text-blue-500 animate-spin" />
        </span>
      );
    case 'success':
      return (
        <span aria-label="上傳成功">
          <CheckCircle aria-hidden="true" className="w-5 h-5 text-green-500" />
        </span>
      );
    case 'error':
      return (
        <span aria-label="上傳失敗">
          <AlertCircle aria-hidden="true" className="w-5 h-5 text-red-500" />
        </span>
      );
    case 'paused':
      return (
        <span aria-label="上傳暫停">
          <Pause aria-hidden="true" className="w-5 h-5 text-yellow-500" />
        </span>
      );
    default:
      return null;
  }
};

export function FileUpload({
  onFileRemove,
  uploadOptions: defaultUploadOptions = {},
  onUpload,
  onSuccess,
  onError,
  multiple = true,
  maxFiles = 10,
  maxSize = 10485760,
  minSize = 0,
  acceptedFileTypes = [],
  autoUpload = true,
  showUploadOptions = false,
  onFilesChange,
  className = '',
  labels: customLabels = {},
  showFileControls = true,
  showFileDetails = true,
  showSimpleFileTypes = true,
  renderFileCard,
}: FileUploadProps) {
  const labels: UploadLabels = { ...defaultLabels, ...customLabels };

  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    isPublic: false,
    ...defaultUploadOptions,
  });

  const [uploadResults, setUploadResults] = useState<Record<string, FileUploadResponse>>({});

  useEffect(() => {
    if (onFilesChange) {
      const uploadedFilesList: UploadedFileInfo[] = Object.values(uploadResults).map(
        (result) => ({
          fileId: result.fileId,
          fileNumber: result.fileNumber,
          fileName: result.fileName,
          fileSize: result.fileSize,
          fileUrl: result.fileUrl,
        })
      );
      onFilesChange(uploadedFilesList);
    }
  }, [uploadResults, onFilesChange]);

  const defaultDeleteHandler = async (serverFileId: string): Promise<boolean> => {
    try {
      await filesManagementApi.deleteFile(serverFileId);
      return true;
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      return false;
    }
  };

  const defaultUploadHandler = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> => {
    return filesManagementApi.uploadFile(
      {
        file,
        description: uploadOptions.description,
        tags: uploadOptions.tags,
        isPublic: uploadOptions.isPublic,
        expiresAt: uploadOptions.expiresAt,
      },
      onProgress
    );
  };

  const {
    loading,
    error,
    isDragging,
    files,
    handleDragEvents,
    handleFileChange,
    removeFile,
    pauseUpload,
    resumeUpload,
  } = useFileUpload<FileUploadResponse>({
    onUpload: onUpload || defaultUploadHandler,
    onSuccess: (response, fileId) => {
      setUploadResults((prev) => ({ ...prev, [fileId]: response }));
      onSuccess?.(response, fileId);
    },
    onError,
    multiple,
    maxFiles,
    maxSize,
    minSize,
    acceptedFileTypes,
    autoUpload,
  });

  const UploadOptionsPanel = (
    <div className="card bg-base-100 border border-base-300 mb-4">
      <div className="card-body p-4">
        <h3 className="card-title text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {labels.uploadOptions}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">{labels.description}</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="檔案描述"
              value={uploadOptions.description || ''}
              onChange={(e) =>
                setUploadOptions((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">{labels.tags}</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="標籤 (以逗號分隔)"
              value={uploadOptions.tags || ''}
              onChange={(e) => setUploadOptions((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={uploadOptions.isPublic}
              onChange={(e) =>
                setUploadOptions((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
            />
            <span className="label-text text-xs">{labels.isPublic}</span>
          </label>
        </div>
      </div>
    </div>
  );

  const enhancedFileCardRenderer = (file: FileWithId, actions: FileCardActions) => {
    const uploadResult = uploadResults[file.id];

    return (
      <div key={file.id} className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getStatusIcon(file.status)}
              {getFileTypeIcon(file.file.type)}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploadResult?.fileName || file.file.name}
                </p>
                <p className="text-xs text-base-content/70">
                  {formatFileSize(file.file.size)}
                  {file.error && <span className="text-error"> • {file.error}</span>}
                </p>

                {showFileDetails && uploadResult && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-base-content/60">
                      ID: {uploadResult.fileNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {showFileControls && (
              <div className="flex gap-1">
                {uploadResult?.fileUrl && (
                  <button
                    onClick={() => window.open(uploadResult.fileUrl, '_blank')}
                    className="btn btn-ghost btn-xs"
                    title="查看檔案"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {file.status === 'uploading' && (
                  <button
                    onClick={actions.pauseUpload}
                    className="btn btn-ghost btn-xs"
                    title="暫停上傳"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}

                {file.status === 'paused' && (
                  <button
                    onClick={actions.resumeUpload}
                    className="btn btn-ghost btn-xs"
                    title="繼續上傳"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={actions.removeFile}
                  className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                  title="移除檔案"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {file.status === 'uploading' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-base-content/70 mb-1">
                <span>上傳進度</span>
                <span>{file.progress}%</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={file.progress}
                max="100"
              ></progress>
            </div>
          )}
        </div>
      </div>
    );
  };

  const defaultDropzoneRenderer = (
    <label
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 
        ${isDragging ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100 hover:bg-base-200'}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload
          className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-base-content/50'}`}
        />
        <p className="mb-2 text-sm text-base-content">
          <span className="font-semibold">{labels.dropzone}</span>
        </p>
        <div className="text-sm text-base-content/70">{labels.browse}</div>
        <p className="text-xs text-base-content/50 mt-2">
          {loading ? labels.uploading : `${labels.maxFiles} ${maxFiles}`}
          {maxSize ? `, ${labels.maxSize} ${formatFileSize(maxSize)}` : ''}
        </p>

        {acceptedFileTypes.length > 0 && (
          <div className="mt-2 space-y-1 max-w-xs">
            {groupFileTypes(acceptedFileTypes, showSimpleFileTypes).map(([key, group]) => (
              <div key={key} className="flex items-center gap-1 text-xs text-base-content/50">
                <span>•</span>
                {group.icon}
                <span className="truncate">
                  {showSimpleFileTypes
                    ? group.extensions.slice(0, 3).join(', ') +
                      (group.extensions.length > 3 ? '...' : '')
                    : group.extensions.join(', ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={loading}
        multiple={multiple}
        accept={acceptedFileTypes.join(',')}
        className="hidden"
      />
    </label>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {showUploadOptions && UploadOptionsPanel}

      <div
        className="w-full"
        onDragEnter={handleDragEvents.handleDragEnter}
        onDragLeave={handleDragEvents.handleDragLeave}
        onDragOver={handleDragEvents.handleDragOver}
        onDrop={handleDragEvents.handleDrop}
      >
        {defaultDropzoneRenderer}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-4 h-4" />
          <span>{error.message}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => {
            const actions: FileCardActions = {
              removeFile: async () => {
                const result = uploadResults[file.id];
                if (file.status === 'success' && result) {
                  const success = await defaultDeleteHandler(result.fileId);
                  if (success) {
                    onFileRemove?.(result.fileId);
                    setUploadResults((prev) => {
                      const newResults = { ...prev };
                      delete newResults[file.id];
                      return newResults;
                    });
                  } else {
                    return; // Fail to delete from server, don't remove from UI
                  }
                }
                void removeFile(file.id);
              },
              pauseUpload: () => pauseUpload(file.id),
              resumeUpload: () => resumeUpload(file.id),
              downloadFile: () => {
                const result = uploadResults[file.id];
                if (result?.fileUrl) {
                  window.open(result.fileUrl, '_blank');
                }
              },
              previewFile: () => {
                const result = uploadResults[file.id];
                if (result?.fileUrl) {
                  window.open(result.fileUrl, '_blank');
                }
              },
            };

            return renderFileCard
              ? renderFileCard(file, actions, uploadResults[file.id])
              : enhancedFileCardRenderer(file, actions);
          })}
        </div>
      )}
    </div>
  );
}
