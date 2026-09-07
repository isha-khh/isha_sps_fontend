import { useCallback, useMemo, useState } from 'react';
import type { DateRange, DateRangePreset } from '@/types/statistics';

interface PresetOption {
  label: string;
  value: DateRangePreset;
  getDates: () => DateRange;
}

export interface DateRangePickerProps {
  /** 開始日期 (YYYY-MM-DD) */
  startDate: string;
  /** 結束日期 (YYYY-MM-DD) */
  endDate: string;
  /** 日期變更回調 */
  onChange: (range: DateRange) => void;
  /** 顯示哪些預設選項 */
  presets?: DateRangePreset[];
}

/**
 * 日期範圍選擇器元件
 */
export const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  presets = ['today', '7d', '30d', '90d', 'custom'],
}: DateRangePickerProps) => {
  // 用戶是否主動選擇自訂模式
  const [isCustomMode, setIsCustomMode] = useState(false);

  const formatDate = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);

  // 根據傳入的日期計算當前匹配的 preset
  const matchedPreset = useMemo((): DateRangePreset => {
    const today = formatDate(new Date());
    const todayDate = new Date();

    // 今天
    if (startDate === today && endDate === today) {
      return 'today';
    }

    // 7 天
    const start7d = new Date(todayDate);
    start7d.setDate(start7d.getDate() - 6);
    if (startDate === formatDate(start7d) && endDate === today) {
      return '7d';
    }

    // 30 天
    const start30d = new Date(todayDate);
    start30d.setDate(start30d.getDate() - 29);
    if (startDate === formatDate(start30d) && endDate === today) {
      return '30d';
    }

    // 90 天
    const start90d = new Date(todayDate);
    start90d.setDate(start90d.getDate() - 89);
    if (startDate === formatDate(start90d) && endDate === today) {
      return '90d';
    }

    return 'custom';
  }, [startDate, endDate, formatDate]);

  // 實際顯示的 activePreset：如果用戶主動選擇自訂，顯示 custom；否則顯示匹配的 preset
  const activePreset = isCustomMode ? 'custom' : matchedPreset;

  const presetOptions: PresetOption[] = useMemo(
    () => [
      {
        label: '今天',
        value: 'today',
        getDates: () => {
          const today = formatDate(new Date());
          return { startDate: today, endDate: today };
        },
      },
      {
        label: '7 天',
        value: '7d',
        getDates: () => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 6);
          return { startDate: formatDate(start), endDate: formatDate(end) };
        },
      },
      {
        label: '30 天',
        value: '30d',
        getDates: () => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 29);
          return { startDate: formatDate(start), endDate: formatDate(end) };
        },
      },
      {
        label: '90 天',
        value: '90d',
        getDates: () => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 89);
          return { startDate: formatDate(start), endDate: formatDate(end) };
        },
      },
      {
        label: '自訂',
        value: 'custom',
        getDates: () => ({ startDate, endDate }),
      },
    ],
    [formatDate, startDate, endDate]
  );

  const filteredPresets = useMemo(
    () => presetOptions.filter((p) => presets.includes(p.value)),
    [presetOptions, presets]
  );

  const handlePresetClick = useCallback(
    (preset: PresetOption) => {
      if (preset.value === 'custom') {
        setIsCustomMode(true);
      } else {
        setIsCustomMode(false);
        onChange(preset.getDates());
      }
    },
    [onChange]
  );

  const handleCustomDateChange = useCallback(
    (field: 'startDate' | 'endDate', value: string) => {
      const newRange = { startDate, endDate };
      newRange[field] = value;
      onChange(newRange);
    },
    [startDate, endDate, onChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 預設選項按鈕 */}
      <div className="join">
        {filteredPresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`btn join-item btn-sm ${
              activePreset === preset.value ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 自訂日期輸入 */}
      {activePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input input-bordered input-sm"
            value={startDate}
            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
            max={endDate}
          />
          <span className="text-base-content/50">至</span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={endDate}
            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
            min={startDate}
          />
        </div>
      )}
    </div>
  );
};
