import { apiClient } from '@/lib/api-client';
import type { SystemFile } from '@/types/files';
import type {
  FileListItem,
  FileUploadResponse,
  FileStatistics,
  BatchDeleteRequest,
  BatchMoveRequest,
  BatchCopyRequest,
  BatchOperationResponse,
} from '@/types/files';
import type { PagedResponse } from '@/types/api';

export interface FileQueryParameters {
  keyword?: string;
  fileType?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ========== 檔案 API (Legacy Compat) ==========
export const filesManagementApi = {
  /**
   * 獲取統計數據
   */
  async getStatistics(): Promise<FileStatistics> {
    try {
      const response = await apiClient.get('/api/FileManagement/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file statistics, using mock data:', error);
      // Return mock data for development/missing endpoint
      return {
        totalFiles: 0,
        totalSize: 0,
        formattedTotalSize: '0 B',
        usedSpaceBytes: 0,
        totalSpaceBytes: 250 * 1024 * 1024 * 1024, // 250 GB
        usagePercentage: 0,
        recycleBinCount: 0,
        recycleBinSize: 0,
        formattedRecycleBinSize: '0 B',
        fileTypeDistribution: {
          images: 0,
          videos: 0,
          documents: 0,
          others: 0,
        },
        storageByExtension: {},
      };
    }
  },

  /**
   * 獲取檔案列表
   */
  async getFiles(): Promise<SystemFile[]> {
    try {
      const response = await apiClient.get('/api/FileManagement/query');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    }
  },

  /**
   * 查詢檔案 (支援分頁與過濾)
   */
  async queryFiles(params: FileQueryParameters): Promise<PagedResponse<FileListItem>> {
     const response = await apiClient.get('/api/FileManagement/query', { params });
     return response.data;
  },

  /**
   * 獲取檔案詳情
   */
  async getFileById(id:  string): Promise<SystemFile> {
    try {
      const response = await apiClient.get(`/api/FileManagement/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file:', error);
      throw error;
    }
  },

  /**
   * 上傳檔案
   */
  async uploadFile(
    options: {
      file: File;
      description?: string;
      tags?: string;
      isPublic?: boolean;
      expiresAt?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', options.file);
      if (options.description) formData.append('description', options.description);
      if (options.tags) formData.append('tags', options.tags);
      if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));
      if (options.expiresAt) formData.append('expiresAt', options.expiresAt);

      const response = await apiClient.post('/api/FileManagement/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  },

  /**
   * 批量上傳檔案
   */
  async uploadFiles(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<void> {
     try {
       // Since the backend supports batch upload via /api/FileManagement/upload/batch
       // But typically FormData with multiple files works better or worse depending on backend binding.
       // The backend controller takes `BatchFileUploadRequest` which has `List<IFormFile> Files`.

       const formData = new FormData();
       files.forEach(file => {
         formData.append('files', file);
       });

       await apiClient.post('/api/FileManagement/upload/batch', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
       });
     } catch (error) {
        console.error('Failed to batch upload files:', error);
        throw error;
     }
  },

  /**
   * 回收檔案
   */
  async recycleFile(id: number | string): Promise<void> {
    try {
      await apiClient.delete(`/api/FileManagement/${id}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },
  /**
   * 刪除檔案
   */
  async deleteFile(id: number | string): Promise<void> {
    try {
      await apiClient.delete(`/api/FileManagement/${id}/permanent`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  // ========== 批量操作 API ==========

  /**
   * 批量刪除檔案
   * @param request 批量刪除請求
   * @returns 批量操作響應
   */
  async batchDelete(request: BatchDeleteRequest): Promise<BatchOperationResponse> {
    const response = await apiClient.post('/api/FileManagement/batch/delete', request);
    return response.data;
  },

  /**
   * 批量移動檔案
   * @param request 批量移動請求
   * @returns 批量操作響應
   */
  async batchMove(request: BatchMoveRequest): Promise<BatchOperationResponse> {
    const response = await apiClient.post('/api/FileManagement/batch/move', request);
    return response.data;
  },

  /**
   * 批量複製檔案
   * @param request 批量複製請求
   * @returns 批量操作響應
   */
  async batchCopy(request: BatchCopyRequest): Promise<BatchOperationResponse> {
    const response = await apiClient.post('/api/FileManagement/batch/copy', request);
    return response.data;
  },

  /**
   * 獲取批量操作任務狀態
   * @param taskId 任務 ID
   * @returns 任務狀態
   */
  async getBatchOperationStatus(taskId: string): Promise<BatchOperationResponse> {
    const response = await apiClient.get(`/api/FileManagement/batch/status/${taskId}`);
    return response.data;
  },

  /**
   * 輪詢批量操作狀態直到完成
   * @param taskId 任務 ID
   * @param onProgress 進度回調
   * @param intervalMs 輪詢間隔(毫秒)
   * @returns 最終任務狀態
   */
  async pollBatchOperationStatus(
    taskId: string,
    onProgress?: (status: BatchOperationResponse) => void,
    intervalMs: number = 500
  ): Promise<BatchOperationResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getBatchOperationStatus(taskId);
          onProgress?.(status);

          if (status.status === 'InProgress') {
            setTimeout(poll, intervalMs);
          } else {
            resolve(status);
          }
        } catch (error) {
          reject(error);
        }
      };
      void poll();
    });
  }
};
