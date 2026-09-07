import React, { type ReactNode } from "react";
// 導入常用圖標
import {
    Archive,
    Download,
    Edit,
    Eye,
    File,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Folder,
    FolderOpen,
    Image,
    Lock,
    Music,
    Share,
    ShieldCheck,
    Trash2,
    Upload,
    Video,
} from "lucide-react";
import { ItemDropdown } from "@/components/file/FolderItemDropdown";

export type IFileTableRow = {
    icon: string;
    name: string;
    size: string;
    date: string;
    owner: string;
    sharedWith: ReactNode;
    checked?: boolean;           // checkbox 勾選狀態（批量操作用）
    selected?: boolean;          // 列選中狀態（預覽用）
    onCheck?: (checked: boolean) => void;  // checkbox 變更回調
    onClick?: () => void;        // 點擊列的回調（預覽用）
    onDelete?: () => void;
    onPermanentDelete?: () => void;
    onDownload?: () => void;
};

// 創建圖標映射
const iconMap = {
    // 文件夾
    folder: Folder,
    folderOpen: FolderOpen,

    // 通用文件
    file: File,
    fileText: FileText,
    shieldcheck: ShieldCheck,
    // 媒體文件
    image: Image,
    music: Music,
    video: Video,
    fileImage: FileImage,
    fileVideo: FileVideo,
    fileAudio: FileAudio,

    // 文檔類型
    fileSpreadsheet: FileSpreadsheet,
    fileCode: FileCode,

    // 壓縮文件
    archive: Archive,

    // 操作圖標
    download: Download,
    upload: Upload,
    trash: Trash2,
    edit: Edit,
    share: Share,
    lock: Lock,
    eye: Eye,
} as const;

// 圖標名稱類型
export type IconName = keyof typeof iconMap;

// 類型守衛函數
const isLucideIcon = (icon: string): icon is IconName => {
    return icon in iconMap;
};

// 動態圖標組件
interface DynamicIconProps {
    iconName: string;
    className?: string;
    fallbackIcon?: React.ComponentType<{ className?: string }>;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
    iconName,
    className = "size-5",
    fallbackIcon: FallbackIcon,
}) => {
    // 檢查是否為 Lucide 圖標
    if (isLucideIcon(iconName)) {
        const IconComponent = iconMap[iconName];
        return <IconComponent className={className} />;
    }

    // 如果提供了自定義的備用圖標
    if (FallbackIcon) {
        return <FallbackIcon className={className} />;
    }

    // 默認使用 Iconify
    return <span className={`iconify ${iconName} ${className}`}></span>;
};

// FileTableRow 組件
export const FileTableRow = ({
    icon,
    size,
    name,
    date,
    owner,
    sharedWith,
    checked,
    selected,
    onCheck,
    onClick,
    onDelete,
    onPermanentDelete,
    onDownload,
}: IFileTableRow) => {
    // 點擊列時觸發選擇（用於預覽）
    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        // 如果點擊的是 checkbox 或按鈕區域，不觸發列選擇
        const target = e.target as HTMLElement;
        if (
            target.closest('input[type="checkbox"]') ||
            target.closest("button") ||
            target.closest(".dropdown")
        ) {
            return;
        }
        onClick?.();
    };

    // 處理 checkbox 點擊，阻止冒泡
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onCheck?.(e.target.checked);
    };

    return (
        <tr
            className={`hover:bg-base-200 cursor-pointer transition-colors ${
                selected ? "bg-primary/10 hover:bg-primary/15" : ""
            } ${checked ? "bg-base-200" : ""}`}
            onClick={handleRowClick}
        >
            <td>
                <input
                    className="checkbox checkbox-sm"
                    aria-label={`Select ${name}`}
                    type="checkbox"
                    checked={checked || false}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            <td>
                <div className="flex items-center space-x-3">
                    <div className="bg-base-200 text-base-content/80 rounded-box flex items-center p-1.5">
                        <DynamicIcon iconName={icon} />
                    </div>
                    <div className="text-sm font-medium truncate max-w-75" title={name}>
                        {name}
                    </div>
                </div>
            </td>
            <td>{size}</td>
            <td>{date}</td>
            <td>{owner}</td>
            <td>{sharedWith}</td>
            <td>
                <ItemDropdown
                    onDelete={onDelete}
                    onPermanentDelete={onPermanentDelete}
                    onDownload={onDownload}
                />
            </td>
        </tr>
    );
};
