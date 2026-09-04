import { useState, useRef } from 'react';
import { filesManagementApi } from '@/lib/api/files-management';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import type { FileListItem, FileUploadResponse } from '@/types/files';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageUploadField = ({ value, onChange, label = '圖片' }: ImageUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 檔案選擇器狀態
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案 (jpg, png, gif, webp)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('圖片檔案不能超過 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await filesManagementApi.uploadFile(
        {
          file,
          description: `Puck editor image: ${file.name}`,
          isPublic: true,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      onChange(response.fileUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('圖片上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 從檔案選擇器選擇
  const handlePickerSelect = (file: FileListItem | FileUploadResponse) => {
    const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
    onChange(fileUrl);
    setIsFilePickerOpen(false);
    setError(null);
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>

      {/* Preview */}
      {value && !isUploading && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-base-300 max-h-48"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
            title="移除圖片"
          >
            <span className="iconify lucide--x size-4" />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm" />
            <span className="text-sm">上傳中... {uploadProgress}%</span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={uploadProgress}
            max="100"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error alert-sm">
          <span className="iconify lucide--alert-circle size-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Upload Button, Picker Button, and URL Input */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm btn-neutral"
            disabled={isUploading}
          >
            <span className="iconify lucide--upload size-4" />
            {value ? '更換圖片' : '上傳圖片'}
          </button>

          {/* 從檔案庫選擇按鈕 */}
          <button
            type="button"
            onClick={() => setIsFilePickerOpen(true)}
            className="btn btn-sm btn-outline"
            disabled={isUploading}
          >
            <span className="iconify lucide--folder-open size-4" />
            從檔案庫選擇
          </button>
        </div>

        {/* Manual URL Input (Alternative) */}
        <div className="flex-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="或輸入圖片網址..."
            className="input input-bordered input-sm w-full"
            disabled={isUploading}
          />
        </div>
      </div>

      <p className="text-xs text-base-content/60">
        支援 JPG、PNG、GIF、WebP 格式，檔案大小不超過 5MB
      </p>

      {/* 檔案選擇器 Modal */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        onSelect={handlePickerSelect}
        fileType="image"
        title="選擇圖片"
      />
    </div>
  );
};
