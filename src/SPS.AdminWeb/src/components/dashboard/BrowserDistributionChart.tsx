import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { BrowserDistribution } from '@/types/dashboard';

interface BrowserDistributionChartProps {
  data: BrowserDistribution;
}

export const BrowserDistributionChart = ({ data }: BrowserDistributionChartProps) => {
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
      type: 'bar',
      toolbar: {
        show: false,
      },
      foreColor: isDark ? '#a6adbb' : '#6b7280',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      offsetX: 30,
      style: {
        colors: [isDark ? '#a6adbb' : '#374151'],
      },
    },
    xaxis: {
      categories: ['Chrome', 'Firefox', 'Safari', 'Edge', '其他'],
    },
    yaxis: {
      title: {
        text: '瀏覽器',
      },
    },
    colors: ['#3b82f6'],
    grid: {
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
    },
  };

  const series = [
    {
      name: '使用率',
      data: [data.chrome, data.firefox, data.safari, data.edge, data.other],
    },
  ];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">瀏覽器類型分佈</h2>
        <Chart options={options} series={series} type="bar" height={300} />
      </div>
    </div>
  );
};
