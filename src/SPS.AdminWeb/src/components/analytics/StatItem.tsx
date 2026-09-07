export interface StatItemProps {
  /** 標題 */
  title: string;
  /** 數值 */
  amount: string | number;
  /** 變化百分比 (正數為增長，負數為下降) */
  percent?: number;
  /** 圖示 (iconify 格式) */
  icon: string;
  /** 是否選中狀態 */
  selected?: boolean;
  /** 是否顯示趨勢 */
  showTrend?: boolean;
}

/**
 * 統計卡片元件
 * 用於顯示關鍵指標數據
 */
export const StatItem = ({
  title,
  percent = 0,
  amount,
  icon,
  selected = false,
  showTrend = true,
}: StatItemProps) => {
  const isPositive = percent >= 0;

  return (
    <div
      className={`card bg-base-100 shadow-sm ${
        selected
          ? 'from-primary to-primary/85 text-primary-content bg-gradient-to-tr shadow-primary/10 shadow-md'
          : ''
      }`}
    >
      <div className="card-body gap-2 p-4 2xl:p-5">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-box flex items-center p-1.5 ${
              selected ? 'bg-primary-content/15' : 'bg-base-200'
            }`}
          >
            <span className={`iconify size-4.5 ${icon}`} />
          </div>
          <p className="line-clamp-1 font-medium max-2xl:text-sm">{title}</p>
        </div>
        <div className="mt-5 mb-0.5 flex items-center gap-2 text-sm 2xl:gap-3">
          <p className="text-lg font-medium leading-none 2xl:text-2xl">{amount}</p>
          {showTrend && percent !== 0 && (
            <>
              {isPositive ? (
                <div
                  className={`badge badge-soft badge-success badge-sm gap-0.5 px-1.5 ${
                    selected ? '!border-transparent !bg-primary-content/15 !text-primary-content' : ''
                  }`}
                >
                  <span className="iconify lucide--arrow-up size-3" />
                  {Math.abs(percent)}%
                </div>
              ) : (
                <div
                  className={`badge badge-soft badge-error badge-sm gap-0.5 px-1.5 ${
                    selected ? '!border-transparent !bg-primary-content/15 !text-primary-content' : ''
                  }`}
                >
                  <span className="iconify lucide--arrow-down size-3" />
                  {Math.abs(percent)}%
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
