interface LoadingEffectProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * 圖表載入效果元件 (Skeleton)
 */
export const LoadingEffect = ({ width, height, className }: LoadingEffectProps) => {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
};
