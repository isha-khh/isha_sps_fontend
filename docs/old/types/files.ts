export interface SystemFile {
  id: string;
  name: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedBy?: string;
  createdTime: string;
}

export interface UploadFileRequest {
  file: File;
  description?: string;
}
export const FileStatus = {
  Active: 1,
  Deleted: 2,
  Archived: 3,
  Uploading: 4,
  UploadFailed: 5,
} as const;

export type FileStatus = typeof FileStatus[keyof typeof FileStatus];

export interface FileInfo {
  id: string;
  fileNumber: string;
  originalFileName: string;
  fileExtension: string;
  contentType: string;
  fileSize: number;
  formattedFileSize: string;
  fileHash: string;
  status: FileStatus;
  description?: string;
  tags: string[];
  downloadCount: number;
  isPublic: boolean;
  uploadedBy?: string;
  uploaderName?: string;
  fileUrl: string;
  createdTime: string;
  lastAccessedAt?: string;
  expiresAt?: string;
}

export interface FileListItem {
  id: string;
  fileNumber: string;
  originalFileName: string;
  fileExtension: string;
  fileSize: number;
  formattedFileSize: string;
  contentType: string;
  status: FileStatus;
  uploaderName?: string;
  createdTime: string;
}

export interface FileStatistics {
  totalFiles: number;
  totalSize: number;
  formattedTotalSize: string;
  usedSpaceBytes: number;
  totalSpaceBytes: number;
  usagePercentage: number;
  /** 回收桶文件數量 */
  recycleBinCount: number;
  /** 回收桶總大小 */
  recycleBinSize: number;
  /** 格式化的回收桶大小 */
  formattedRecycleBinSize: string;
  fileTypeDistribution: {
    images: number;
    videos: number;
    documents: number;
    others: number;
  };
  storageByExtension: Record<string, number>;
}

export interface FileQueryRequest {
  keyword?: string;
  status?: FileStatus;
  uploadedBy?: string;
  fileExtension?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface FileUploadRequest {
  file: File;
  description?: string;
  tags?: string;
  isPublic?: boolean;
  expiresAt?: string;
}

export interface BatchFileUploadRequest {
  files: File[];
  isPublic?: boolean;
  expiresAt?: string;
}

export interface FileUploadResponse {
  fileId: string;
  fileNumber: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileUrl: string;
  fileHash: string;
  uploadedAt: string;
}

export interface FailedFileUpload {
  fileName: string;
  errorMessage: string;
}

export interface BatchFileUploadResponse {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  uploadedFiles: FileUploadResponse[];
  failedFiles: FailedFileUpload[];
}

// ========== 批量操作相關型別 ==========

/**
 * 批量操作狀態
 */
export const BatchOperationStatus = {
  InProgress: 'InProgress',
  Completed: 'Completed',
  PartiallyCompleted: 'PartiallyCompleted',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;

export type BatchOperationStatus = typeof BatchOperationStatus[keyof typeof BatchOperationStatus];

/**
 * 批量刪除請求
 */
export interface BatchDeleteRequest {
  fileIds: string[];
  permanent?: boolean;
}

/**
 * 批量移動請求
 */
export interface BatchMoveRequest {
  fileIds: string[];
  targetParentId?: string | null;
}

/**
 * 批量複製請求
 */
export interface BatchCopyRequest {
  fileIds: string[];
  targetParentId?: string | null;
}

/**
 * 批量操作失敗項目
 */
export interface BatchOperationFailedItem {
  fileId: string;
  fileName: string;
  errorMessage: string;
}

/**
 * 批量操作響應
 */
export interface BatchOperationResponse {
  taskId: string;
  status: BatchOperationStatus;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  progressPercentage: number;
  startedAt: string;
  completedAt?: string;
  failedItems: BatchOperationFailedItem[];
  createdFiles?: FileInfo[];
}
