interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  colorClass = 'text-primary',
}: StatCardProps) => {
  return (
    <div className="stats shadow bg-base-100 hover:shadow-lg transition-shadow">
      <div className="stat">
        <div className={`stat-figure ${colorClass}`}>
          <span className={`iconify ${icon} size-8`} />
        </div>
        <div className="stat-title">{title}</div>
        <div className={`stat-value ${colorClass}`}>{value}</div>
        {description && <div className="stat-desc">{description}</div>}
        {trend && (
          <div className="stat-desc">
            <span className={trend.isPositive ? 'text-success' : 'text-error'}>
              {trend.isPositive ? '↗︎' : '↘︎'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
