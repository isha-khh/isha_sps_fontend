import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { ActiveAccountsData } from '@/types/dashboard';

interface ActiveAccountsChartProps {
  data: ActiveAccountsData[];
}

export const ActiveAccountsChart = ({ data }: ActiveAccountsChartProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 檢測主題
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
      type: 'area',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      foreColor: isDark ? '#a6adbb' : '#6b7280',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: data.map((item) => item.date),
      labels: {
        formatter: (value) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
    },
    yaxis: {
      title: {
        text: '活躍帳號數',
      },
    },
    tooltip: {
      x: {
        format: 'yyyy-MM-dd',
      },
      theme: isDark ? 'dark' : 'light',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
    colors: ['#3b82f6'],
    grid: {
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
  };

  const series = [
    {
      name: '活躍帳號',
      data: data.map((item) => item.count),
    },
  ];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">活躍帳號報告</h2>
        <Chart options={options} series={series} type="area" height={300} />
      </div>
    </div>
  );
};
