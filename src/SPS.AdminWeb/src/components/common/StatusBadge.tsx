import { parseBounceCode } from '@/lib/bounce-codes';

export interface StatusBadgeProps {
  /** 是否成功 */
  isSuccess: boolean;
  /** 錯誤訊息（失敗時可選） */
  errorMessage?: string | null;
  /** 成功時的文字 */
  successText?: string;
  /** 失敗時的文字 */
  failedText?: string;
  /** badge 大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** tooltip 位置 */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 狀態 Badge 組件
 * 成功顯示綠色，失敗顯示紅色 + 狀態碼 + tooltip 中文說明
 *
 * @example
 * // 基本用法
 * <StatusBadge isSuccess={true} />
 * <StatusBadge isSuccess={false} errorMessage="5.7.1 Relaying denied" />
 *
 * // 自訂文字
 * <StatusBadge isSuccess={true} successText="已發送" failedText="發送失敗" />
 */
export const StatusBadge = ({
  isSuccess,
  errorMessage,
  successText = '成功',
  failedText = '失敗',
  size = 'sm',
  tooltipPosition = 'left',
}: StatusBadgeProps) => {
  if (isSuccess) {
    return (
      <span className={`badge badge-success badge-${size}`}>
        {successText}
      </span>
    );
  }

  const errorInfo = parseBounceCode(errorMessage);
  const hasCode = !!errorInfo.code;
  const tooltipText = hasCode
    ? `${errorInfo.description}\n${errorInfo.suggestion}`
    : errorMessage || '';

  if (tooltipText) {
    return (
      <div className={`tooltip tooltip-${tooltipPosition}`} data-tip={tooltipText}>
        <span className={`badge badge-error badge-${size} cursor-help`}>
          {failedText}
          {hasCode && <span className="ml-1 opacity-70">{errorInfo.code}</span>}
        </span>
      </div>
    );
  }

  return (
    <span className={`badge badge-error badge-${size}`}>
      {failedText}
    </span>
  );
};

export interface BounceStatusBadgeProps {
  /** 退信狀態: 0=無, 1=硬退信, 2=軟退信 */
  bounceStatus: number;
  /** 退信代碼 */
  bounceCode?: string | null;
  /** badge 大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** tooltip 位置 */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 退信狀態 Badge 組件
 *
 * @example
 * <BounceStatusBadge bounceStatus={0} />
 * <BounceStatusBadge bounceStatus={1} bounceCode="5.1.1" />
 * <BounceStatusBadge bounceStatus={2} bounceCode="4.2.2" />
 */
export const BounceStatusBadge = ({
  bounceStatus,
  bounceCode,
  size = 'sm',
  tooltipPosition = 'left',
}: BounceStatusBadgeProps) => {
  if (bounceStatus === 0) {
    return <span className="text-base-content/50">-</span>;
  }

  const info = parseBounceCode(bounceCode);
  const isHard = bounceStatus === 1;
  const badgeColor = isHard ? 'error' : 'warning';
  const statusText = isHard ? '硬退信' : '軟退信';
  const tooltipText = `${info.description}\n${info.suggestion}`;

  return (
    <div className={`tooltip tooltip-${tooltipPosition}`} data-tip={tooltipText}>
      <span className={`badge badge-${badgeColor} badge-${size} cursor-help`}>
        {statusText}
        {bounceCode && <span className="ml-1 opacity-70">{bounceCode}</span>}
      </span>
    </div>
  );
};

export interface MailStatusProps {
  /** 發送是否成功 */
  isSuccess: boolean;
  /** 錯誤訊息 */
  errorMessage?: string | null;
  /** 退信狀態: 0=無, 1=硬退信, 2=軟退信 */
  bounceStatus: number;
  /** 退信代碼 */
  bounceCode?: string | null;
  /** badge 大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * 郵件狀態組件 - 同時顯示發送狀態和退信狀態
 *
 * @example
 * <MailStatus
 *   isSuccess={true}
 *   bounceStatus={0}
 * />
 * <MailStatus
 *   isSuccess={false}
 *   errorMessage="5.7.1 Relaying denied"
 *   bounceStatus={1}
 *   bounceCode="5.1.1"
 * />
 */
export const MailStatus = ({
  isSuccess,
  errorMessage,
  bounceStatus,
  bounceCode,
  size = 'sm',
}: MailStatusProps) => {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge
        isSuccess={isSuccess}
        errorMessage={errorMessage}
        successText="成功"
        failedText="失敗"
        size={size}
      />
      <BounceStatusBadge
        bounceStatus={bounceStatus}
        bounceCode={bounceCode}
        size={size}
      />
    </div>
  );
};
