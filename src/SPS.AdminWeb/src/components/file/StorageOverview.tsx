import {StorageActivity} from "./StorageActivity";
import {StorageUploadProcess} from "./StorageUploadProcess";
import * as Icons from "lucide-react";
import type { FileStatistics, BatchOperationResponse } from '@/types/files';

interface StorageOverviewProps {
    stats: FileStatistics | null;
    batchProgress?: BatchOperationResponse | null;
}

export const StorageOverview = ({ stats, batchProgress }: StorageOverviewProps) => {
    const usagePercentage = stats?.usagePercentage ?? 0;
    const displayUsage = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4, // 允許顯示到更多位數，避免極小值變 0
}).format(usagePercentage) + '%';
    const formattedUsedSpace = stats?.formattedTotalSize ?? '0 B';
    const totalSpaceGB = stats ? (stats.totalSpaceBytes / (1024 * 1024 * 1024)).toFixed(0) : '0';

    return (
        <div className="card bg-base-100 card-border">
            <div className="card-body gap-0">
                <div className="flex items-center justify-between">
                    <p className="font-medium">系統詳情</p>
                </div>
                <div className="card card-border bg-primary/5 border-primary/10 mt-3">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-2.5">
                            <Icons.FolderKanban  className="text-primary"/>

                            <span className="text-primary font-medium">系統空間</span>
                            <span className="text-primary ms-auto text-sm font-medium">{displayUsage} </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{formattedUsedSpace}</span>
                            <span className="text-base-content/80 text-xs">總共 {totalSpaceGB} GB</span>
                        </div>
                        <progress max={100} value={usagePercentage} className="progress progress-primary mt-1 h-1.5" />
                    </div>
                </div>
                <p className="mt-6 text-sm font-medium">執行中</p>
                <div className="mt-3">
                    <StorageUploadProcess batchProgress={batchProgress} />
                </div>
                <p className="mt-6 text-sm font-medium">操作紀錄</p>
                <div className="mt-3 overflow-hidden">
                    <StorageActivity />
                </div>
            </div>
        </div>
    );
};
