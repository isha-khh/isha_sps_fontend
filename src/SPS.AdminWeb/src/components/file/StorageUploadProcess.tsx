import type { BatchOperationResponse } from '@/types/files';

interface StorageUploadProcessProps {
    batchProgress?: BatchOperationResponse | null;
}

export const StorageUploadProcess = ({ batchProgress }: StorageUploadProcessProps) => {
    // 如果沒有任何進行中的任務，顯示空狀態
    const hasActiveTasks = batchProgress && batchProgress.status === 'InProgress';

    if (!hasActiveTasks) {
        return (
            <div className="card card-border border-base-300">
                <div className="card-body px-4 py-3">
                    <p className="text-base-content/50 text-sm text-center">目前沒有執行中的任務</p>
                </div>
            </div>
        );
    }

    // 獲取操作類型名稱
    const getOperationName = () => {
        // 根據 taskId 或其他方式判斷操作類型
        // 這裡簡單返回「批量操作」
        return '批量操作';
    };

    const progressPercent = batchProgress.progressPercentage;
    const progressClass = batchProgress.failureCount > 0 ? 'progress-warning' : 'progress-info';

    return (
        <div className="card card-border border-base-300">
            <div className="card-body px-4 pt-3 pb-2">
                {/* 批量操作進度 */}
                <div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium max-sm:text-sm flex items-center gap-2">
                            <span className="loading loading-spinner loading-xs"></span>
                            {getOperationName()}
                        </span>
                        <span className="text-xs text-base-content/60">
                            {batchProgress.processedCount} / {batchProgress.totalCount}
                        </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                        <span>已完成 {progressPercent.toFixed(0)}%</span>
                        {batchProgress.failureCount > 0 && (
                            <span className="text-error">失敗 {batchProgress.failureCount} 個</span>
                        )}
                    </div>
                    <progress
                        className={`progress ${progressClass} h-1 align-super`}
                        max={100}
                        value={progressPercent}
                    />
                </div>
            </div>
        </div>
    );
};
