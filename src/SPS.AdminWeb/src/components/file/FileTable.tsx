import { FileTableRow } from "./FileTableRow";
import * as Icons from "lucide-react";
import { SelectItemDropdown } from "@/components/file/FolderItemDropdown";
import type { FileListItem } from "@/types/files";
import { useState, useEffect, useRef } from "react";
import { filesManagementApi } from "@/lib/api/files-management";
import { getFileIcon } from "@/components/file/FileIcon.tsx";
import { useNotify } from '@/hooks/useNotify';

// 定義 webkitdirectory 屬性的類型擴展
interface DirectoryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    webkitdirectory?: string;
    directory?: string;
}

interface FileTableProps {
    files?: FileListItem[];
    isLoading?: boolean;
    onDelete?: (id: string) => void;
    onPermanentDelete?: (id: string) => void;
    onDownload?: (file: FileListItem) => void;
    onSelect?: (file: FileListItem) => void; // 選擇檔案時的回調（用於預覽）
    search?: string;
    onSearchChange?: (value: string) => void;
    fileType?: string;
    onFileTypeChange?: (value: string) => void;
    onUploadSuccess?: () => void;
    selectedFileId?: string; // 當前選中的檔案 ID（由外部控制高亮）
    // 批量操作回調
    onBatchDelete?: (ids: string[]) => void;
    onBatchMove?: (ids: string[], targetParentId: string | null) => void;
    onBatchCopy?: (ids: string[], targetParentId: string | null) => void;
    isBatchOperating?: boolean; // 是否正在執行批量操作
}

export const FileTable = ({
    files = [],
    isLoading,
    onDelete,
    onPermanentDelete,
    onDownload,
    onSelect,
    search,
    onSearchChange,
    fileType,
    onFileTypeChange,
    onUploadSuccess,
    selectedFileId,
    onBatchDelete,
    onBatchMove,
    onBatchCopy,
    isBatchOperating,
}: FileTableProps) => {
    const notify = useNotify();
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Reset selection when files change (e.g., page change, filter change)
    useEffect(() => {
        setCheckedIds(new Set());
    }, [files]);

    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            setCheckedIds(new Set(files.map((f) => f.id)));
        } else {
            setCheckedIds(new Set());
        }
    };

    const handleCheckRow = (id: string, checked: boolean) => {
        const newChecked = new Set(checkedIds);
        if (checked) {
            newChecked.add(id);
        } else {
            newChecked.delete(id);
        }
        setCheckedIds(newChecked);
    };

    // 點擊列時觸發選擇（用於預覽）
    const handleRowClick = (file: FileListItem) => {
        onSelect?.(file);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = e.target.files;
        if (!uploadFiles || uploadFiles.length === 0) return;

        try {
            if (uploadFiles.length > 1) {
                await filesManagementApi.uploadFiles(Array.from(uploadFiles));
            } else {
                await filesManagementApi.uploadFile({ file: uploadFiles[0] });
            }
            onUploadSuccess?.();
            await notify.success("上傳成功");
        } catch (error) {
            console.error(error);
            await notify.error("上傳失敗");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = e.target.files;
        if (!uploadFiles || uploadFiles.length === 0) return;

        try {
            await filesManagementApi.uploadFiles(Array.from(uploadFiles));
            onUploadSuccess?.();
            await notify.success("資料夾上傳成功");
        } catch (error) {
            console.error(error);
            await notify.error("資料夾上傳失敗");
        } finally {
            if (folderInputRef.current) folderInputRef.current.value = "";
        }
    };

    const isAllChecked = files.length > 0 && checkedIds.size === files.length;
    const isIndeterminate = checkedIds.size > 0 && checkedIds.size < files.length;

    // 處理 webkitdirectory 屬性
    const folderInputProps: DirectoryInputProps = {
        webkitdirectory: "",
        directory: "",
    };

    return (
        <div className="card card-border bg-base-100">
          {notify.NotifyComponent}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileUpload}
            />
            <input
                type="file"
                ref={folderInputRef}
                className="hidden"
                {...folderInputProps}
                onChange={handleFolderUpload}
            />

            <div className="card-body p-0">
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                    <div className="inline-flex items-center gap-3">
                        {/* 批量操作按鈕 - 當有選中項目時顯示 */}
                        {checkedIds.size > 0 && (
                            <div className="inline-flex items-center gap-2 bg-base-200 rounded-lg px-3 py-1.5">
                                <span className="text-sm font-medium">
                                    已選擇 {checkedIds.size} 個項目
                                </span>
                                <div className="divider divider-horizontal mx-1"></div>
                                <button
                                    className="btn btn-ghost btn-xs gap-1"
                                    onClick={() => onBatchDelete?.(Array.from(checkedIds))}
                                    disabled={isBatchOperating}
                                    title="批量刪除"
                                >
                                    <Icons.Trash2 className="size-3.5" />
                                    刪除
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs gap-1"
                                    onClick={() => onBatchMove?.(Array.from(checkedIds), null)}
                                    disabled={isBatchOperating}
                                    title="批量移動"
                                >
                                    <Icons.FolderInput className="size-3.5" />
                                    移動
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs gap-1"
                                    onClick={() => onBatchCopy?.(Array.from(checkedIds), null)}
                                    disabled={isBatchOperating}
                                    title="批量複製"
                                >
                                    <Icons.Copy className="size-3.5" />
                                    複製
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => setCheckedIds(new Set())}
                                    title="取消選擇"
                                >
                                    <Icons.X className="size-3.5" />
                                </button>
                                {isBatchOperating && (
                                    <span className="loading loading-spinner loading-xs"></span>
                                )}
                            </div>
                        )}
                        <div className="dropdown dropdown-bottom dropdown-start">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-ghost btn-square border-base-300 btn-sm"
                                aria-label="Add"
                            >
                                <Icons.Plus className={"text-base-content/80 size-4"} />
                            </div>
                            <div
                                tabIndex={0}
                                className="dropdown-content bg-base-100 rounded-box mt-2 w-52 shadow"
                            >
                                <ul className="menu w-full p-1.5">
                                    <li>
                                        <div onClick={async () => await notify.warning("暫不支援建立資料夾")}>
                                            <span className="iconify lucide--folder size-4" />
                                            建立新資料夾
                                        </div>
                                    </li>
                                </ul>
                                <hr className="border-base-300" />
                                <ul className="menu w-full p-1.5">
                                    <li>
                                        <div onClick={() => folderInputRef.current?.click()}>
                                            <span className="iconify lucide--folder-up size-4" />
                                            上傳資料夾
                                        </div>
                                    </li>
                                    <li>
                                        <div onClick={() => fileInputRef.current?.click()}>
                                            <span className="iconify lucide--file-up size-4" />
                                            上傳檔案
                                        </div>
                                    </li>
                                </ul>
                                <hr className="border-base-300" />
                                <ul className="menu w-full p-1.5">
                                    <li>
                                        <div onClick={async () => await notify.warning("暫不支援建立文件")}>
                                            <span className="iconify lucide--file-text size-4" />
                                            建立文件
                                        </div>
                                    </li>
                                    <li>
                                        <div onClick={async () => await notify.warning("暫不支援建立表格")}>
                                            <span className="iconify lucide--file-spreadsheet size-4" />
                                            建立表格
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-3">
                        <label className="input input-sm">
                            <span className="iconify lucide--search text-base-content/80 size-4" />
                            <input
                                type="search"
                                className="grow"
                                placeholder="搜尋..."
                                aria-label="Search chat"
                                value={search}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                            />
                        </label>
                        <div className="hidden sm:block">
                            <select
                                className="select select-sm w-32"
                                value={fileType}
                                onChange={(e) => onFileTypeChange?.(e.target.value)}
                                aria-label="File type"
                            >
                                <option value="">全部類型</option>
                                <option value="image">圖片</option>
                                <option value="video">影片</option>
                                <option value="document">文件</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <SelectItemDropdown />
                    </div>
                </div>
                <div>
                    <table className="rounded-box mt-2 table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        className="checkbox checkbox-sm"
                                        aria-label="Select All"
                                        type="checkbox"
                                        checked={isAllChecked}
                                        ref={(input) => {
                                            if (input) input.indeterminate = isIndeterminate;
                                        }}
                                        onChange={(e) => handleCheckAll(e.target.checked)}
                                    />
                                </th>
                                <th>檔案名稱</th>
                                <th>檔案大小</th>
                                <th>建立時間</th>
                                <th>擁有者</th>
                                <th>分享於..</th>
                                <th>動作</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </td>
                                </tr>
                            ) : files.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-base-content/60">
                                        沒有找到檔案
                                    </td>
                                </tr>
                            ) : (
                                files.map((item) => (
                                    <FileTableRow
                                        key={item.id}
                                        icon={getFileIcon(item.originalFileName)}
                                        name={item.originalFileName}
                                        size={item.formattedFileSize}
                                        date={new Date(item.createdTime).toLocaleDateString()}
                                        owner={item.uploaderName || "-"}
                                        sharedWith={<span className="text-base-content/60">-</span>}
                                        checked={checkedIds.has(item.id)}
                                        selected={selectedFileId === item.id}
                                        onCheck={(checked) => handleCheckRow(item.id, checked)}
                                        onClick={() => handleRowClick(item)}
                                        onDelete={() => onDelete?.(item.id)}
                                        onPermanentDelete={() => onPermanentDelete?.(item.id)}
                                        onDownload={() => onDownload?.(item)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
