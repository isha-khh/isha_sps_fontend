import { PageTitle } from '@/components/PageTitle';
import { useConfig, lightThemes, darkThemes } from '@/contexts/config';
import type { ILightTheme, IDarkTheme } from '@/contexts/config';

// 主題標籤
const themeLabels: Record<string, string> = {
  // Nexus UI
  light: 'Light',
  contrast: 'Contrast',
  material: 'Material',
  dark: 'Dark',
  dim: 'Dim',
  'material-dark': 'Material Dark',
  // DaisyUI Light
  cupcake: 'Cupcake',
  bumblebee: 'Bumblebee',
  emerald: 'Emerald',
  corporate: 'Corporate',
  retro: 'Retro',
  cyberpunk: 'Cyberpunk',
  valentine: 'Valentine',
  garden: 'Garden',
  lofi: 'Lofi',
  pastel: 'Pastel',
  fantasy: 'Fantasy',
  wireframe: 'Wireframe',
  cmyk: 'CMYK',
  autumn: 'Autumn',
  acid: 'Acid',
  lemonade: 'Lemonade',
  winter: 'Winter',
  nord: 'Nord',
};

// 字體選項
const fontFamilies: { value: string; label: string }[] = [
  { value: 'default', label: '預設' },
  { value: 'dm-sans', label: 'DM Sans' },
  { value: 'wix', label: 'Wix Madefor' },
  { value: 'inclusive', label: 'Inclusive Sans' },
  { value: 'ar-one', label: 'AR One Sans' },
];

// 主題卡片組件
const ThemeCard = ({
  theme,
  label,
  isActive,
  onClick,
}: {
  theme: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    data-theme={theme}
    className={`rounded-box cursor-pointer border-2 transition-all hover:scale-105 ${
      isActive ? 'border-primary ring-2 ring-primary/30' : 'border-base-300'
    }`}
    onClick={onClick}
  >
    <div className="bg-base-100 rounded-box p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="bg-primary rounded-full w-2.5 h-2.5" />
        <div className="bg-secondary rounded-full w-2.5 h-2.5" />
        <div className="bg-accent rounded-full w-2.5 h-2.5" />
        <div className="bg-neutral rounded-full w-2.5 h-2.5" />
      </div>
      <div className="space-y-1.5">
        <div className="bg-base-200 rounded h-1.5 w-full" />
        <div className="bg-base-200 rounded h-1.5 w-3/4" />
        <div className="bg-base-300 rounded h-1.5 w-1/2" />
      </div>
      <div className="flex gap-1 mt-2">
        <div className="btn btn-primary btn-xs px-1.5">P</div>
        <div className="btn btn-secondary btn-xs px-1.5">S</div>
      </div>
    </div>
    <div className="bg-base-200 px-3 py-1.5 rounded-b-box flex items-center justify-between">
      <span className="text-xs font-medium">{label}</span>
      {isActive && <span className="iconify lucide--check size-3.5 text-primary" />}
    </div>
  </div>
);

export const AppearancePage = () => {
  const {
    config,
    currentTheme,
    isDarkMode,
    systemPrefersDark,
    changeLightTheme,
    changeDarkTheme,
    setFollowSystem,
    setManualMode,
    changeFontFamily,
    changeSidebarTheme,
    changeDirection,
    reset,
  } = useConfig();

  return (
    <div className="space-y-6">
      <PageTitle
        title="外觀設定"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '外觀設定', active: true },
        ]}
      />

      {/* 當前設定摘要 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-lg">當前設定</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge badge-primary">
                  {isDarkMode ? '深色' : '淺色'}: {themeLabels[currentTheme] || currentTheme}
                </span>
                <span className="badge badge-secondary">
                  {config.followSystem ? '跟隨系統' : '手動模式'}
                </span>
                <span className="badge badge-accent">字體: {config.fontFamily}</span>
                <span className="badge">方向: {config.direction.toUpperCase()}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              <span className="iconify lucide--rotate-ccw size-4" />
              重設為預設
            </button>
          </div>
        </div>
      </div>

      {/* 模式切換 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">
            <span className="iconify lucide--settings-2 size-5" />
            模式設定
          </h3>

          <div className="form-control mt-4">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.followSystem}
                onChange={(e) => setFollowSystem(e.target.checked)}
              />
              <div>
                <span className="label-text font-medium">跟隨系統</span>
                <p className="text-sm text-base-content/60">
                  {config.followSystem
                    ? `根據系統偏好自動切換 (目前系統: ${systemPrefersDark ? '深色' : '淺色'})`
                    : '手動選擇使用淺色或深色模式'}
                </p>
              </div>
            </label>
          </div>

          {!config.followSystem && (
            <div className="flex gap-3 mt-4">
              <button
                className={`btn flex-1 ${config.manualMode === 'light' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setManualMode('light')}
              >
                <span className="iconify lucide--sun size-5" />
                淺色模式
              </button>
              <button
                className={`btn flex-1 ${config.manualMode === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setManualMode('dark')}
              >
                <span className="iconify lucide--moon size-5" />
                深色模式
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 淺色主題選擇 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">
            <span className="iconify lucide--sun size-5" />
            淺色主題
            {!isDarkMode && <span className="badge badge-primary badge-sm">使用中</span>}
          </h3>
          <p className="text-sm text-base-content/60">
            選擇淺色模式時使用的主題
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 mt-4">
            {lightThemes.map((theme) => (
              <ThemeCard
                key={theme}
                theme={theme}
                label={themeLabels[theme] || theme}
                isActive={config.lightTheme === theme}
                onClick={() => changeLightTheme(theme as ILightTheme)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 深色主題選擇 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">
            <span className="iconify lucide--moon size-5" />
            深色主題
            {isDarkMode && <span className="badge badge-primary badge-sm">使用中</span>}
          </h3>
          <p className="text-sm text-base-content/60">
            選擇深色模式時使用的主題
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 mt-4">
            {darkThemes.map((theme) => (
              <ThemeCard
                key={theme}
                theme={theme}
                label={themeLabels[theme] || theme}
                isActive={config.darkTheme === theme}
                onClick={() => changeDarkTheme(theme as IDarkTheme)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 其他設定 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 側邊欄主題 */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">
              <span className="iconify lucide--sidebar size-5" />
              側邊欄主題
            </h3>
            <p className="text-sm text-base-content/60">僅在淺色模式下有效</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                className={`btn btn-sm ${config.sidebarTheme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => changeSidebarTheme('light')}
              >
                <span className="iconify lucide--sun size-4" />
                淺色
              </button>
              <button
                className={`btn btn-sm ${config.sidebarTheme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => changeSidebarTheme('dark')}
              >
                <span className="iconify lucide--moon size-4" />
                深色
              </button>
            </div>
          </div>
        </div>

        {/* 字體選擇 */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">
              <span className="iconify lucide--type size-5" />
              字體
            </h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  className={`btn btn-sm ${config.fontFamily === font.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => changeFontFamily(font.value as typeof config.fontFamily)}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 文字方向 */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">
              <span className="iconify lucide--align-left size-5" />
              文字方向
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                className={`btn btn-sm ${config.direction === 'ltr' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => changeDirection('ltr')}
              >
                LTR
              </button>
              <button
                className={`btn btn-sm ${config.direction === 'rtl' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => changeDirection('rtl')}
              >
                RTL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
