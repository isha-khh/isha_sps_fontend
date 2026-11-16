import {useState, useEffect, useCallback} from 'react';
import {StorageOverview} from "./StorageOverview";
import {UploadButton} from "./UploadButton";
import {FolderList} from "./FolderList";
import {FileTable} from "./FileTable";
import {Pagination} from "@/components/common/Pagination";
import * as Icons from "lucide-react";
import { filesManagementApi } from '@/lib/api/files-management.ts';
import type {FileListItem, FileStatistics, BatchOperationResponse} from '@/types/files';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

const FileApp = () => {
    const notify = useNotify();
    const [files, setFiles] = useState<FileListItem[]>([]);
    const [stats, setStats] = useState<FileStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fileType, setFileType] = useState('');
    const { confirmDialog, ConfirmComponent } = useConfirm();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    // 批量操作狀態
    const [isBatchOperating, setIsBatchOperating] = useState(false);
    const [batchProgress, setBatchProgress] = useState<BatchOperationResponse | null>(null);

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await filesManagementApi.queryFiles({
                keyword: search || undefined,
                fileType: fileType || undefined,
                pageIndex: currentPage,
                pageSize: pageSize
            });
            setFiles(data.items);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoading(false);
        }
    }, [search, fileType, currentPage, pageSize]);

    const fetchStats = async () => {
        try {
            const data = await filesManagementApi.getStatistics();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        void fetchStats();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, fileType]);

    useEffect(() => {
      const timer = setTimeout(() => {
        void fetchFiles();
      }, 300);
      return () => clearTimeout(timer);
    }, [search, fileType, currentPage, fetchFiles]);

    const handleRecycle = async (id: string) => {
        const confirmed = await confirmDialog({
            cardTitle: '回收檔案',
            message: '確定要將此檔案丟入回收嗎？',
            buttonConfirm: '回收',
            confirmStyle: 'bg-warning',
        });
        if (!confirmed) return;
        try {
            await filesManagementApi.recycleFile(id);
            await fetchFiles();
            await fetchStats();
        } catch (error) {
            console.error('Failed to Recycle file:', error);
            await notify.error('回收檔案失敗');
        }
    };
    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            cardTitle: '刪除檔案',
            message: '確定要刪除此檔案嗎？',
            buttonConfirm: '刪除',
            confirmStyle: 'bg-error',
        });
        if (!confirmed) return;
        try {
            await filesManagementApi.deleteFile(id);
            await fetchFiles();
            await fetchStats();
        } catch (error) {
            console.error('Failed to delete file:', error);
            await notify.error('刪除檔案失敗');
        }
    };

    const handleDownload = (file: FileListItem) => {
        // Since FileListItem doesn't have fileUrl directly in some cases,
        // we might need to get it or use a download endpoint.
        // But FileInfo has fileUrl. For now, if we don't have it, we might need to fetch by id.
        // In src/types/file.ts, FileListItem doesn't have fileUrl, but FileInfo does.
        // Let's check if we can just open a window to /api/FileManagement/download/{id}
        window.open(`/api/FileManagement/${file.id}/download`, '_blank');
    };

    // ========== 批量操作處理 ==========

    const handleBatchDelete = async (ids: string[]) => {
        const confirmed = await confirmDialog({
            cardTitle: '批量回收',
            message: `確定要將 ${ids.length} 個檔案丟入回收桶嗎？`,
            buttonConfirm: '回收',
            confirmStyle: 'bg-warning',
        });
        if (!confirmed) return;

        setIsBatchOperating(true);
        setBatchProgress(null);

        try {
            const response = await filesManagementApi.batchDelete({
                fileIds: ids,
                permanent: false
            });

            // 如果是即時完成，直接處理結果
            if (response.status !== 'InProgress') {
                handleBatchOperationComplete(response);
            } else {
                // 輪詢進度
                await filesManagementApi.pollBatchOperationStatus(
                    response.taskId,
                    (status) => setBatchProgress(status)
                ).then(handleBatchOperationComplete);
            }
        } catch (error) {
            console.error('Batch delete failed:', error);
            await notify.error('批量刪除失敗');
        } finally {
            setIsBatchOperating(false);
            setBatchProgress(null);
        }
    };

    const handleBatchMove = async (ids: string[], targetParentId: string | null) => {
        // TODO: 可以加入選擇目標資料夾的對話框
        const confirmed = await confirmDialog({
            cardTitle: '批量移動',
            message: `確定要移動 ${ids.length} 個檔案到根目錄嗎？`,
            buttonConfirm: '移動',
        });
        if (!confirmed) return;

        setIsBatchOperating(true);
        setBatchProgress(null);

        try {
            const response = await filesManagementApi.batchMove({
                fileIds: ids,
                targetParentId: targetParentId
            });

            if (response.status !== 'InProgress') {
                handleBatchOperationComplete(response);
            } else {
                await filesManagementApi.pollBatchOperationStatus(
                    response.taskId,
                    (status) => setBatchProgress(status)
                ).then(handleBatchOperationComplete);
            }
        } catch (error) {
            console.error('Batch move failed:', error);
            await notify.error('批量移動失敗');
        } finally {
            setIsBatchOperating(false);
            setBatchProgress(null);
        }
    };

    const handleBatchCopy = async (ids: string[], targetParentId: string | null) => {
        // TODO: 可以加入選擇目標資料夾的對話框
        const confirmed = await confirmDialog({
            cardTitle: '批量複製',
            message: `確定要複製 ${ids.length} 個檔案到根目錄嗎？`,
            buttonConfirm: '複製',
        });
        if (!confirmed) return;

        setIsBatchOperating(true);
        setBatchProgress(null);

        try {
            const response = await filesManagementApi.batchCopy({
                fileIds: ids,
                targetParentId: targetParentId
            });

            if (response.status !== 'InProgress') {
                handleBatchOperationComplete(response);
            } else {
                await filesManagementApi.pollBatchOperationStatus(
                    response.taskId,
                    (status) => setBatchProgress(status)
                ).then(handleBatchOperationComplete);
            }
        } catch (error) {
            console.error('Batch copy failed:', error);
            await notify.error('批量複製失敗');
        } finally {
            setIsBatchOperating(false);
            setBatchProgress(null);
        }
    };

    const handleBatchOperationComplete = async (result: BatchOperationResponse) => {
        // 顯示結果
        if (result.status === 'Completed') {
            await notify.success(`操作完成！成功處理 ${result.successCount} 個檔案`);
        } else if (result.status === 'PartiallyCompleted') {
            const failedNames = result.failedItems.map(f => f.fileName).join(', ');
            await notify.success(`部分完成：成功 ${result.successCount} 個，失敗 ${result.failureCount} 個\n失敗項目: ${failedNames}`);
        } else if (result.status === 'Failed') {
            await notify.error('操作失敗，請稍後再試');
        }

        // 刷新列表和統計
        void fetchFiles();
        void fetchStats();
    };

    return (
        <>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-4">
            <div className="col-span-1 xl:col-span-2 2xl:col-span-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">檔案管理員</h3>
                    <div className="inline-flex items-center gap-3">
                        <div className="drawer drawer-end">
                            <input
                                id="apps-file-overview-drawer"
                                className="drawer-toggle"
                                type="checkbox"
                                aria-label="File Overview Trigger"
                            />
                            <div className="drawer-content">
                                <label
                                    htmlFor="apps-file-overview-drawer"
                                    className="btn drawer-button btn-sm btn-ghost border-base-300 flex xl:hidden">
                                    <Icons.FolderKanban size={20}/>
                                </label>
                            </div>
                            <div className="drawer-side z-50">
                                <label
                                    htmlFor="apps-file-overview-drawer"
                                    aria-label="close sidebar"
                                    className="drawer-overlay"></label>
                                <div className="w-72">
                                    <StorageOverview stats={stats} batchProgress={batchProgress} />
                                </div>
                            </div>
                        </div>
                        <UploadButton onSuccess={()=>{ void fetchFiles(); void fetchStats(); }} />
                    </div>
                </div>
                <div className="mt-6">
                    {/*<StatList />*/} {/*雲端空間*/}
                </div>
                <h3 className="mt-6 font-medium">資料夾</h3>
                <div className="mt-3">
                    <FolderList stats={stats} onFolderClick={setFileType} />
                </div>
                                <h3 className="mt-6 font-medium">你的檔案</h3>
                                <div className="mt-3">
                                    <FileTable
                                        files={files}
                                        isLoading={isLoading}
                                        onDelete={handleRecycle}
                                        onPermanentDelete={handleDelete}
                                        onDownload={handleDownload}
                                        search={search}
                                        onSearchChange={setSearch}
                                        fileType={fileType}
                                        onFileTypeChange={setFileType}
                                        onUploadSuccess={() => { void fetchFiles(); void fetchStats(); }}
                                        onBatchDelete={handleBatchDelete}
                                        onBatchMove={handleBatchMove}
                                        onBatchCopy={handleBatchCopy}
                                        isBatchOperating={isBatchOperating}
                                    />
                                </div>
                                <div className="mt-6">                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        isLoading={isLoading}
                    />
                </div>
            </div>
            <div className="hidden xl:col-span-1 xl:block 2xl:col-span-1">
                <StorageOverview stats={stats} batchProgress={batchProgress} />
            </div>
        </div>
        {ConfirmComponent}
      {notify.NotifyComponent}
        </>
    );
};

export default FileApp;
