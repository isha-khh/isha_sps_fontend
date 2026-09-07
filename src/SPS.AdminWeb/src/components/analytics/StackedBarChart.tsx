import type { ApexOptions } from 'apexcharts';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { LoadingEffect } from './LoadingEffect';

const ApexCharts = lazy(() => import('react-apexcharts'));

// 預設顏色
const DEFAULT_COLORS = ['#6c74f8', '#ff8b4b'];

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface StackedBarChartProps {
  /** 標題 */
  title?: string;
  /** X 軸類別標籤 */
  categories: string[];
  /** 資料系列 */
  series: ChartSeries[];
  /** 自訂顏色陣列 */
  colors?: string[];
  /** 高度 */
  height?: number;
  /** 是否堆疊 */
  stacked?: boolean;
  /** X 軸標籤格式化函式 */
  xAxisFormatter?: (value: string) => string;
  /** Y 軸標籤格式化函式 */
  yAxisFormatter?: (value: number) => string;
}

/**
 * 堆疊柱狀圖元件
 * 用於顯示多系列資料趨勢
 */
export const StackedBarChart = ({
  title,
  categories,
  series,
  colors = DEFAULT_COLORS,
  height = 288,
  stacked = true,
  xAxisFormatter,
  yAxisFormatter,
}: StackedBarChartProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        height,
        type: 'bar',
        stacked,
        background: 'transparent',
        toolbar: { show: false },
      },
      ...(title && {
        title: {
          text: title,
          style: { fontWeight: '500' },
        },
      }),
      plotOptions: {
        bar: {
          borderRadius: 8,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          colors: {
            backgroundBarColors: ['rgba(150,150,150,0.07)'],
            backgroundBarRadius: 8,
          },
          columnWidth: '45%',
          barHeight: '100%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: colors.slice(0, series.length),
      legend: {
        show: true,
        horizontalAlign: 'center',
        offsetX: 0,
        offsetY: 6,
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: xAxisFormatter ? { formatter: xAxisFormatter } : {},
      },
      yaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          show: true,
          ...(yAxisFormatter && { formatter: yAxisFormatter }),
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
      },
      grid: {
        show: true,
        borderColor: 'var(--color-base-300)',
        strokeDashArray: 3,
      },
      responsive: [
        {
          breakpoint: 450,
          options: {
            plotOptions: {
              bar: { borderRadius: 4 },
            },
            xaxis: {
              tickAmount: 3,
            },
          },
        },
      ],
    }),
    [title, height, stacked, categories, series.length, colors, xAxisFormatter, yAxisFormatter]
  );

  if (!mounted) return <LoadingEffect height={height} />;

  // 檢查是否有有效資料
  const hasValidData = series.length > 0 &&
    categories.length > 0 &&
    series.some(s => s.data.length > 0 && s.data.some(v => v > 0));

  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-base-content/50">暫無資料</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingEffect height={height} />}>
      <ApexCharts options={chartOptions} type="bar" height={height} series={series} />
    </Suspense>
  );
};
