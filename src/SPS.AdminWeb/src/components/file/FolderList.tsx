import {FolderItem, type IFolderItem} from "./FolderItem";
import type { FileStatistics } from '@/types/files';

export const FolderList = ({
    stats,
    onFolderClick
}: {
    stats: FileStatistics | null;
    onFolderClick?: (type: string) => void;
}) => {
    const folders: IFolderItem[] = [
        {
            icon: "image",
            name: "我的圖片",
            filesCount: stats?.fileTypeDistribution.images ?? 0,
            iconClass: "bg-primary/5 text-primary",
            onClick: () => onFolderClick?.('image'),
        },
        {
            icon: "fileText",
            name: "文件檔案",
            filesCount: stats?.fileTypeDistribution.documents ?? 0,
            iconClass: "bg-secondary/5 text-secondary",
            onClick: () => onFolderClick?.('document'),
        },
        {
            icon: "video",
            name: "影片",
            filesCount: stats?.fileTypeDistribution.videos ?? 0,
            iconClass: "bg-info/5 text-info",
            onClick: () => onFolderClick?.('video'),
        },
        {
            icon: "file",
            name: "其他檔案",
            filesCount: stats?.fileTypeDistribution.others ?? 0,
            iconClass: "bg-warning/5 text-warning",
            onClick: () => onFolderClick?.('other'),
        },
        {
            icon: "trash",
            name: "回收桶",
            filesCount: stats?.recycleBinCount ?? 0,
            iconClass: "bg-error/5 text-error",
            onClick: () => onFolderClick?.('trash'),
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 2xl:grid-cols-5">
                {folders.map((folder, index) => (
                    <FolderItem key={index} {...folder} />
                ))}
            </div>
        </>
    );
};
