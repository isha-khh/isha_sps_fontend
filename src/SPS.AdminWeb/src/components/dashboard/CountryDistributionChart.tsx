import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { CountryDistribution } from '@/types/dashboard';

interface CountryDistributionChartProps {
  data: CountryDistribution[];
}

export const CountryDistributionChart = ({ data }: CountryDistributionChartProps) => {
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
      type: 'pie',
      foreColor: isDark ? '#a6adbb' : '#6b7280',
    },
    labels: data.map((item) => item.country),
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (_val: number, opts: { seriesIndex: number }) => {
        return data[opts.seriesIndex].count.toString();
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => `${val} 位訪客`,
      },
    },
  };

  const series = data.map((item) => item.count);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">國家分佈</h2>
        <Chart options={options} series={series} type="pie" height={300} />
      </div>
    </div>
  );
};
