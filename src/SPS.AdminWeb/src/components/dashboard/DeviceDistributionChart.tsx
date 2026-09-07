import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { DeviceDistribution } from '@/types/dashboard';

interface DeviceDistributionChartProps {
  data: DeviceDistribution;
}

export const DeviceDistributionChart = ({ data }: DeviceDistributionChartProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark' || theme === 'dim' || theme === 'material-dark');
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      foreColor: isDark ? '#a6adbb' : '#6b7280',
    },
    labels: ['桌面裝置', '行動裝置', '平板'],
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
        },
      },
    },
  };

  const series = [data.desktop, data.mobile, data.tablet];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">裝置類型分佈</h2>
        <Chart options={options} series={series} type="donut" height={300} />
      </div>
    </div>
  );
};
