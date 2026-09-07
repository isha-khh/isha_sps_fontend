import type { ApexOptions } from 'apexcharts';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { LoadingEffect } from './LoadingEffect';

const ApexCharts = lazy(() => import('react-apexcharts'));

// 預設顏色調色盤
const DEFAULT_COLORS = [
  '#167bff',
  '#FDA403',
  '#FB6D48',
  '#A25772',
  '#8E7AB5',
  '#FFA299',
  '#E3C878',
  '#6B8E23',
  '#4682B4',
  '#9370DB',
];

export interface DonutChartProps {
  /** 標題 */
  title?: string;
  /** 資料 (鍵值對，鍵為標籤，值為數值) */
  data: Record<string, number>;
  /** 自訂顏色陣列 */
  colors?: string[];
  /** 高度 */
  height?: number;
  /** 數值格式化函式 */
  valueFormatter?: (value: number) => string;
}

/**
 * 環形圖元件
 * 用於顯示資料分佈
 */
export const DonutChart = ({
  title,
  data,
  colors = DEFAULT_COLORS,
  height = 320,
  valueFormatter = (v) => v.toString(),
}: DonutChartProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { labels, series, total } = useMemo(() => {
    const entries = Object.entries(data).filter(([, value]) => value > 0);
    return {
      labels: entries.map(([key]) => key),
      series: entries.map(([, value]) => value),
      total: entries.reduce((acc, [, value]) => acc + value, 0),
    };
  }, [data]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        height,
        toolbar: { show: false },
        background: 'transparent',
      },
      ...(title && {
        title: {
          text: title,
          style: { fontWeight: '500' },
          align: 'right' as const,
        },
      }),
      stroke: {
        show: true,
        width: 1,
        colors: ['var(--color-base-100)'],
      },
      fill: {
        type: 'gradient',
      },
      plotOptions: {
        pie: {
          startAngle: -45,
          endAngle: 315,
          donut: {
            size: '60%',
            labels: {
              show: true,
              value: {
                formatter: (value) => valueFormatter(Number(value)),
                color: 'var(--color-base-content)',
              },
              total: {
                show: true,
                color: '#FF4560',
                label: '總計',
                formatter: () => valueFormatter(total),
              },
            },
          },
        },
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (value) => valueFormatter(value),
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' },
          },
        },
      ],
      labels,
      colors: colors.slice(0, labels.length),
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
      },
    }),
    [title, height, labels, colors, total, valueFormatter]
  );

  if (!mounted) return <LoadingEffect height={height} />;

  // 檢查是否有有效資料（數據數量為0或所有值都是0）
  if (series.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-base-content/50">暫無資料</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingEffect height={height} />}>
      <ApexCharts options={chartOptions} type="donut" height={height} series={series} />
    </Suspense>
  );
};
