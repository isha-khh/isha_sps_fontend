import type { CSSProperties } from 'react';

/** 徽章三個顏色；空字串 = 沒設定，前台套預設樣式 */
export interface BadgeColors {
  badgeColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
}

export const emptyBadgeColors: BadgeColors = { badgeColor: '', badgeTextColor: '', badgeBorderColor: '' };

/** 後端回來的分類／標籤 → 表單狀態 */
export const badgeColorsFrom = (source?: { badgeColor?: string | null; badgeTextColor?: string | null; badgeBorderColor?: string | null }): BadgeColors => ({
  badgeColor: source?.badgeColor ?? '',
  badgeTextColor: source?.badgeTextColor ?? '',
  badgeBorderColor: source?.badgeBorderColor ?? '',
});

/**
 * 表單狀態 → 送給後端的欄位。空字串照送：更新時代表「清除，恢復預設」，新增時後端當作沒設定。
 */
export const badgeColorsToRequest = (colors: BadgeColors) => ({
  badgeColor: colors.badgeColor,
  badgeTextColor: colors.badgeTextColor,
  badgeBorderColor: colors.badgeBorderColor,
});

/** 前台沒設定顏色時的預設樣式（對照 SPS.Web 的 `.badge-tag`／`ul.ul-key li a`），預覽用 */
const DEFAULTS = {
  category: { background: '#A333C8', color: '#FFFFFF', border: '#A333C8' },
  tag: { background: 'linear-gradient(180deg, #0474D7 0%, #0395BB 100%)', color: '#FFFFFF', border: '#0474D7' },
} as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;
/** 只有合法的 #RRGGBB 才算有效，輸入到一半不影響預覽 */
const valid = (value: string) => HEX.test(value);

export const badgePreviewStyle = (colors: BadgeColors, kind: 'category' | 'tag'): CSSProperties => {
  const base = DEFAULTS[kind];
  const hasBg = valid(colors.badgeColor);
  return {
    background: hasBg ? colors.badgeColor : base.background,
    color: valid(colors.badgeTextColor) ? colors.badgeTextColor : base.color,
    border: `1px solid ${valid(colors.badgeBorderColor) ? colors.badgeBorderColor : hasBg ? colors.badgeColor : 'transparent'}`,
    borderRadius: kind === 'category' ? 4 : 5,
    padding: kind === 'category' ? '3px 12px' : '5px 10px',
    fontWeight: kind === 'category' ? 600 : 400,
    display: 'inline-block',
    lineHeight: 1.5,
  };
};

const PRESETS: { label: string; colors: BadgeColors }[] = [
  { label: '預設', colors: emptyBadgeColors },
  { label: '紫', colors: { badgeColor: '#A333C8', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '藍', colors: { badgeColor: '#0474D7', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '綠', colors: { badgeColor: '#00897B', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '橘', colors: { badgeColor: '#EF6C00', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '紅', colors: { badgeColor: '#D32F2F', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '灰', colors: { badgeColor: '#616161', badgeTextColor: '#FFFFFF', badgeBorderColor: '' } },
  { label: '藍框', colors: { badgeColor: '#FFFFFF', badgeTextColor: '#0474D7', badgeBorderColor: '#0474D7' } },
  { label: '紫框', colors: { badgeColor: '#FFFFFF', badgeTextColor: '#A333C8', badgeBorderColor: '#A333C8' } },
];

/** 色票在「沒設定」時顯示的起始色：分類預設是紫色、標籤預設是藍色（選色器一定要有值，點開從這裡開始挑） */
const FIELDS = (kind: 'category' | 'tag'): { key: keyof BadgeColors; label: string; fallback: string; hint: string }[] => {
  const brand = kind === 'category' ? '#A333C8' : '#0474D7';
  return [
    { key: 'badgeColor', label: '底色', fallback: brand, hint: '沒設定用預設色' },
    { key: 'badgeTextColor', label: '字體顏色', fallback: '#FFFFFF', hint: '沒設定用白色' },
    { key: 'badgeBorderColor', label: '外框顏色', fallback: brand, hint: '沒設定不加外框' },
  ];
};

/**
 * 分類／標籤的徽章顏色欄位（底色、字體顏色、外框顏色，都選填）＋即時預覽＋常用色票。
 * 前台公告、服務專區、輔導專區…的卡片與詳情頁都用這組顏色顯示徽章；沒設定的欄位維持前台預設樣式。
 * `kind`：category＝前台紫色實心徽章，tag＝前台藍色關鍵字。
 */
export const BadgeColorFields = ({
  value,
  onChange,
  previewText,
  kind,
}: {
  value: BadgeColors;
  onChange: (next: BadgeColors) => void;
  previewText: string;
  kind: 'category' | 'tag';
}) => {
  const set = (key: keyof BadgeColors, v: string) => onChange({ ...value, [key]: v.toUpperCase() });

  return (
    <div className="space-y-3 rounded-box border border-base-300 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="label-text font-medium">前台徽章顏色</span>
        <span className="text-xs text-base-content/60">都不設定就維持預設樣式</span>
      </div>

      <div className="flex items-center gap-3 rounded-box bg-base-200 px-4 py-3">
        <span className="text-xs text-base-content/60">預覽</span>
        <span style={badgePreviewStyle(value, kind)}>{previewText.trim() || (kind === 'category' ? '分類名稱' : '標籤名稱')}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => onChange(preset.colors)}
          >
            {preset.colors.badgeColor && (
              <span
                className="inline-block size-3 rounded-full border border-base-300"
                style={{ background: preset.colors.badgeColor, borderColor: preset.colors.badgeBorderColor || undefined }}
              />
            )}
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS(kind).map((field) => {
          const current = value[field.key];
          const invalid = current !== '' && !valid(current);
          return (
            <div key={field.key} className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">{field.label}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${field.label}選色`}
                  className="h-9 w-10 shrink-0 cursor-pointer rounded border border-base-300 bg-transparent p-0.5"
                  value={valid(current) ? current : field.fallback}
                  onChange={(e) => set(field.key, e.target.value)}
                />
                <input
                  type="text"
                  aria-label={`${field.label}色碼`}
                  className={`input input-bordered input-sm w-full font-mono ${invalid ? 'input-error' : ''}`}
                  placeholder="#RRGGBB"
                  maxLength={7}
                  value={current}
                  onChange={(e) => set(field.key, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  disabled={current === ''}
                  onClick={() => set(field.key, '')}
                  title="清除，恢復預設"
                >
                  清除
                </button>
              </div>
              <span className={`mt-1 text-xs ${invalid ? 'text-error' : 'text-base-content/50'}`}>
                {invalid ? '格式必須是 #RRGGBB' : field.hint}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 三個顏色都是空或合法的 #RRGGBB 才能送出 */
export const badgeColorsValid = (colors: BadgeColors) =>
  [colors.badgeColor, colors.badgeTextColor, colors.badgeBorderColor].every((c) => c === '' || valid(c));
