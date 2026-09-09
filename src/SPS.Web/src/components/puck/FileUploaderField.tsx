import React, { useId, useMemo, useRef, useState } from "react";
import { colors } from "@/components/puck/theme";
import { filesManagementApi } from "@/lib/api/files-management";
import { FilePickerModal } from "@/components/shared/FilePickerModal";
import type { FileListItem, FileUploadResponse } from "@/types/files";

type FileType = "image" | "pdf" | "doc" | "xls" | "ppt" | "zip" | "other";

export type UploadedFile = {
    id: string;
    name: string;
    url: string;
    size: string;
    type: FileType;
};

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let b = bytes;
    let i = 0;
    while (b >= 1024 && i < units.length - 1) {
        b /= 1024;
        i += 1;
    }
    const fixed = i === 0 ? 0 : b < 10 ? 1 : 0;
    return `${b.toFixed(fixed)}${units[i]}`;
}

function inferType(fileName: string, mime?: string): FileType {
    const lower = (fileName || "").toLowerCase();
    if (mime?.startsWith("image/")) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
    if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "xls";
    if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "ppt";
    if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".7z")) return "zip";
    return "other";
}

export function FileUploaderField({
    value,
    onChange,
}: {
    value: UploadedFile[];
    onChange: (next: UploadedFile[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const hintId = useId();
    const liveId = useId();
    const inputId = useId();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState(0);

    // 檔案選擇器狀態
    const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

    const count = value?.length ?? 0;

    const accept = useMemo(() => {
        return [
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx",
            ".zip",
            ".rar",
            ".7z",
            "image/*",
        ].join(",");
    }, []);

    async function uploadOne(file: File): Promise<UploadedFile> {
        const response = await filesManagementApi.uploadFile(
            {
                file,
                description: `Puck 編輯器附件: ${file.name}`,
                isPublic: true,
            },
            (progress) => {
                setUploadProgress(progress);
            }
        );

        return {
            id: response.fileId,
            name: response.fileName,
            url: response.fileUrl,
            size: formatBytes(response.fileSize),
            type: inferType(response.fileName, response.contentType),
        };
    }

    async function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        setLoading(true);
        setError("");
        setStatus(`開始上傳 ${files.length} 個檔案。`);
        setUploadProgress(0);

        try {
            const uploaded: UploadedFile[] = [];
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                setStatus(`正在上傳：${f.name} (${i + 1}/${files.length})`);
                uploaded.push(await uploadOne(f));
            }
            onChange([...(value ?? []), ...uploaded]);
            setStatus(`上傳完成，已新增 ${uploaded.length} 個檔案。`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "上傳失敗";
            setError(errorMessage);
            setStatus("上傳失敗，請稍後再試。");
        } finally {
            setLoading(false);
            setUploadProgress(0);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    // 從檔案選擇器選擇
    function handleFileSelect(file: FileListItem | FileUploadResponse) {
        const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
        const fileName = 'fileUrl' in file ? file.fileName : ('originalFileName' in file ? file.originalFileName : '未命名');
        const fileSize = 'fileUrl' in file ? file.fileSize : ('fileSize' in file ? file.fileSize : 0);
        const contentType = file.contentType || '';

        const newFile: UploadedFile = {
            id: 'fileId' in file ? file.fileId : file.id,
            name: fileName,
            url: fileUrl,
            size: formatBytes(fileSize),
            type: inferType(fileName, contentType),
        };

        onChange([...(value ?? []), newFile]);
        setIsFilePickerOpen(false);
        setStatus("已從檔案系統選擇檔案。");
    }

    function remove(id: string) {
        const next = (value ?? []).filter((x) => x.id !== id);
        onChange(next);
        setStatus("已移除檔案。");
    }

    function clearAll() {
        onChange([]);
        setStatus("已清空所有檔案。");
    }

    return (
        <div className="max-w-3xl mx-auto px-6">
            {/* 狀態宣告區（螢幕閱讀器可即時讀出） */}
            <div id={liveId} aria-live="polite" className="sr-only">
                {status}
            </div>

            {/* 外框：比照 FileDownloads 的容器外觀 */}
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                {/* 上傳區 */}
                <div style={{ backgroundColor: colors.bgPrimary }}>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-base font-bold" style={{ color: colors.textPrimary }}>
                                    上傳檔案
                                </div>
                                <p id={hintId} className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                                    可一次選取多個檔案，或從現有檔案庫選擇。支援 PDF、Office、壓縮檔與圖片。
                                </p>
                                <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                                    目前已加入：<span className="font-semibold">{count}</span> 個檔案
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* 上傳按鈕 */}
                                <label
                                    htmlFor={inputId}
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold min-h-11 min-w-[44px] cursor-pointer"
                                    style={{ backgroundColor: colors.accent, color: colors.bgPrimary }}
                                >
                                    {loading ? `上傳中 ${uploadProgress}%` : "上傳檔案"}
                                </label>

                                {/* 從檔案庫選擇 */}
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold min-h-11 min-w-[44px]"
                                    style={{
                                        backgroundColor: "transparent",
                                        color: colors.accent,
                                        border: `2px solid ${colors.accent}`,
                                    }}
                                    onClick={() => setIsFilePickerOpen(true)}
                                    disabled={loading}
                                >
                                    從檔案庫選擇
                                </button>

                                {count > 0 && (
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold min-h-11 min-w-[44px]"
                                        style={{
                                            backgroundColor: "transparent",
                                            color: colors.error,
                                            border: `2px solid ${colors.error}`,
                                        }}
                                        aria-label="清空所有已上傳檔案"
                                        onClick={clearAll}
                                        disabled={loading}
                                    >
                                        清空
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 上傳進度條 */}
                        {loading && uploadProgress > 0 && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${uploadProgress}%`,
                                            backgroundColor: colors.accent,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <input
                        id={inputId}
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={accept}
                        onChange={handlePickFiles}
                        disabled={loading}
                        className="sr-only"
                        aria-describedby={hintId}
                    />

                    {error && (
                        <div
                            className="px-6 pb-6"
                            role="alert"
                            aria-live="assertive"
                        >
                            <div
                                className="rounded-md p-4 text-sm"
                                style={{
                                    backgroundColor: "#ffebee",
                                    color: colors.textPrimary,
                                    borderLeft: `4px solid ${colors.error}`,
                                }}
                            >
                                {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* 檔案清單 */}
                {count > 0 ? (
                    <ul className="divide-y" style={{ backgroundColor: colors.bgPrimary }}>
                        {value.map((f, idx) => (
                            <li key={f.id || `${idx}`} className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-base font-semibold truncate" style={{ color: colors.textPrimary }}>
                                            {f.name || "未命名檔案"}
                                        </div>
                                        <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
                                            {f.type ? f.type.toUpperCase() : "檔案"}
                                            {f.size ? ` · ${f.size}` : ""}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {f.url && (
                                            <a
                                                href={f.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-xs font-semibold min-h-11 min-w-[44px]"
                                                style={{
                                                    backgroundColor: "transparent",
                                                    color: colors.accent,
                                                    border: `2px solid ${colors.accent}`,
                                                }}
                                                aria-label={`開啟檔案連結：${f.name || "附件"}`}
                                            >
                                                開啟
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-xs font-semibold min-h-11 min-w-[44px]"
                                            style={{ backgroundColor: colors.error, color: colors.bgPrimary }}
                                            aria-label={`刪除檔案：${f.name || "未命名檔案"}`}
                                            onClick={() => remove(f.id)}
                                            disabled={loading}
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </div>

                                {!f.url && (
                                    <p className="mt-3 text-sm" style={{ color: colors.error }}>
                                        此檔案缺少 URL，請補上連結才能下載。
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-6" style={{ backgroundColor: colors.bgSecondary }}>
                        <p className="text-base" style={{ color: colors.textSecondary }}>
                            尚未新增檔案。
                        </p>
                    </div>
                )}
            </div>

            {/* 檔案選擇器 Modal */}
            <FilePickerModal
                isOpen={isFilePickerOpen}
                onClose={() => setIsFilePickerOpen(false)}
                onSelect={handleFileSelect}
                fileType="all"
                title="選擇檔案"
            />
        </div>
    );
}
