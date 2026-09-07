import { Link } from 'react-router-dom';
import { type IConfig, useConfig } from "../../contexts/config";
import type { ILightTheme, IDarkTheme } from "../../contexts/config";

const fontFamilies: { value: IConfig["fontFamily"]; label: string; className?: string }[] = [
    {
        value: "dm-sans",
        label: "DM Sans",
        className: "group-[[data-font-family=dm-sans]]/html:bg-base-200",
    },
    {
        value: "wix",
        label: "Wix",
        className: "group-[[data-font-family=wix]]/html:bg-base-200",
    },
    {
        value: "inclusive",
        label: "Inclusive",
        className:
            "group-[[data-font-family=inclusive]]/html:bg-base-200 group-[:not([data-font-family])]/html:bg-base-200",
    },
    {
        value: "ar-one",
        label: "AR One",
        className: "group-[[data-font-family=ar-one]]/html:bg-base-200",
    },
];

// 常用淺色主題
const commonLightThemes: ILightTheme[] = ["light", "material", "cupcake", "nord"];
// 深色主題（只有3個）
const commonDarkThemes: IDarkTheme[] = ["dark", "dim", "material-dark"];

export const Rightbar = () => {
    const {
        config,
        isDarkMode,
        systemPrefersDark,
        toggleFullscreen,
        changeSidebarTheme,
        changeFontFamily,
        changeDirection,
        changeLightTheme,
        changeDarkTheme,
        setFollowSystem,
        setManualMode,
        reset,
    } = useConfig();

    return (
        <div className="drawer drawer-end">
            <input id="layout-rightbar-drawer" type="checkbox" className="drawer-toggle" />
            <div className="drawer-side z-50">
                <label
                    htmlFor="layout-rightbar-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                    aria-hidden
                />
                <div className="bg-base-100 text-base-content flex h-full w-76 flex-col sm:w-96">
                    <div className="bg-base-200/30 border-base-200 flex h-16 min-h-16 items-center justify-between border-b px-5">
                        <p className="text-lg font-medium">自訂外觀</p>
                        <div className="inline-flex gap-1">
                            <button
                                className="btn-ghost btn btn-sm btn-circle relative"
                                onClick={reset}
                                aria-label="Reset">
                                <span className="iconify lucide--rotate-cw size-5" />
                                <span className="bg-error absolute end-0.5 top-0.5 rounded-full p-0 opacity-0 transition-all group-data-[changed]/html:p-[2px] group-data-[changed]/html:opacity-100"></span>
                            </button>
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                onClick={toggleFullscreen}
                                aria-label="Full Screen">
                                <span className="iconify lucide--minimize hidden size-5 group-data-[fullscreen]/html:inline" />
                                <span className="iconify lucide--fullscreen inline size-5 group-data-[fullscreen]/html:hidden" />
                            </button>
                            <label
                                htmlFor="layout-rightbar-drawer"
                                aria-label="close sidebar"
                                aria-hidden
                                className="btn btn-ghost btn-sm btn-circle">
                                <span className="iconify lucide--x size-5" />
                            </label>
                        </div>
                    </div>
                    <div className="grow overflow-auto p-4 sm:p-5">
                        {/* 模式切換 */}
                        <p className="font-medium">模式</p>
                        <div className="mt-3 space-y-3">
                            {/* 跟隨系統開關 */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm"
                                    checked={config.followSystem}
                                    onChange={(e) => setFollowSystem(e.target.checked)}
                                />
                                <div>
                                    <span className="text-sm font-medium">跟隨系統</span>
                                    {config.followSystem && (
                                        <span className="text-xs text-base-content/60 block">
                                            目前: {systemPrefersDark ? '深色' : '淺色'}
                                        </span>
                                    )}
                                </div>
                            </label>

                            {/* 手動模式切換 */}
                            {!config.followSystem && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        className={`btn btn-sm ${config.manualMode === 'light' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setManualMode('light')}
                                    >
                                        <span className="iconify lucide--sun size-4" />
                                        淺色
                                    </button>
                                    <button
                                        className={`btn btn-sm ${config.manualMode === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setManualMode('dark')}
                                    >
                                        <span className="iconify lucide--moon size-4" />
                                        深色
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 淺色主題 */}
                        <p className="mt-6 font-medium flex items-center gap-2">
                            <span className="iconify lucide--sun size-4" />
                            淺色主題
                            {!isDarkMode && <span className="badge badge-primary badge-xs">使用中</span>}
                        </p>
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {commonLightThemes.map((theme) => (
                                <div
                                    key={theme}
                                    data-theme={theme}
                                    className={`rounded-box cursor-pointer border-2 transition-all ${
                                        config.lightTheme === theme ? 'border-primary' : 'border-base-300'
                                    }`}
                                    onClick={() => changeLightTheme(theme)}
                                >
                                    <div className="bg-base-100 rounded-box p-2 text-center">
                                        <div className="flex items-center justify-center gap-0.5">
                                            <span className="rounded-full bg-primary h-3 w-3"></span>
                                            <span className="rounded-full bg-secondary h-3 w-3"></span>
                                        </div>
                                        <p className="mt-1 text-xs capitalize truncate">{theme}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 深色主題 */}
                        <p className="mt-4 font-medium flex items-center gap-2">
                            <span className="iconify lucide--moon size-4" />
                            深色主題
                            {isDarkMode && <span className="badge badge-primary badge-xs">使用中</span>}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {commonDarkThemes.map((theme) => (
                                <div
                                    key={theme}
                                    data-theme={theme}
                                    className={`rounded-box cursor-pointer border-2 transition-all ${
                                        config.darkTheme === theme ? 'border-primary' : 'border-base-300'
                                    }`}
                                    onClick={() => changeDarkTheme(theme)}
                                >
                                    <div className="bg-base-100 rounded-box p-2 text-center">
                                        <div className="flex items-center justify-center gap-0.5">
                                            <span className="rounded-full bg-primary h-3 w-3"></span>
                                            <span className="rounded-full bg-secondary h-3 w-3"></span>
                                        </div>
                                        <p className="mt-1 text-xs capitalize truncate">
                                            {theme === 'material-dark' ? 'Material' : theme}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 更多主題連結 */}
                        <label htmlFor="layout-rightbar-drawer">
                            <Link
                                to="/system/appearance"
                                className="btn btn-ghost btn-sm w-full mt-3 justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="iconify lucide--palette size-4" />
                                    更多主題設定
                                </span>
                                <span className="iconify lucide--chevron-right size-4" />
                            </Link>
                        </label>

                        {/* 側邊欄 */}
                        <div className={`${isDarkMode ? 'pointer-events-none opacity-50' : ''}`}>
                            <p className="mt-6 font-medium">
                                側邊欄
                                {isDarkMode && (
                                    <span className="ms-1 text-xs text-base-content/60">
                                        (僅淺色模式可用)
                                    </span>
                                )}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div
                                    className={`border-base-300 hover:bg-base-200 rounded-box inline-flex cursor-pointer items-center justify-center gap-2 border p-2 ${
                                        config.sidebarTheme === 'light' ? 'bg-base-200' : ''
                                    }`}
                                    onClick={() => changeSidebarTheme("light")}>
                                    <span className="iconify lucide--sun size-4.5" />
                                    淺色
                                </div>
                                <div
                                    className={`border-base-300 hover:bg-base-200 rounded-box inline-flex cursor-pointer items-center justify-center gap-2 border p-2 ${
                                        config.sidebarTheme === 'dark' ? 'bg-base-200' : ''
                                    }`}
                                    onClick={() => changeSidebarTheme("dark")}>
                                    <span className="iconify lucide--moon size-4.5" />
                                    深色
                                </div>
                            </div>
                        </div>

                        {/* 字體 */}
                        <p className="mt-6 font-medium">字體</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            {fontFamilies.map((item, index) => (
                                <div
                                    key={index}
                                    className={
                                        "border-base-300 hover:bg-base-200 rounded-box inline-flex cursor-pointer items-center justify-center gap-2 border p-2 " +
                                        item.className
                                    }
                                    onClick={() => changeFontFamily(item.value)}>
                                    <p data-font-family={item.value} className="font-sans">
                                        {item.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 文字方向 */}
                        <p className="mt-6 font-medium">文字方向</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div
                                className="border-base-300 hover:bg-base-200 rounded-box group-[[dir=ltr]]/html:bg-base-200 group-[:not([dir])]/html:bg-base-200 inline-flex cursor-pointer items-center justify-center gap-2 border p-2"
                                onClick={() => changeDirection("ltr")}>
                                <span className="iconify lucide--pilcrow-left size-4.5" />
                                <span className="hidden sm:inline">左到右</span>
                                <span className="inline sm:hidden">LTR</span>
                            </div>
                            <div
                                className="border-base-300 hover:bg-base-200 rounded-box group-[[dir=rtl]]/html:bg-base-200 inline-flex cursor-pointer items-center justify-center gap-2 border p-2"
                                onClick={() => changeDirection("rtl")}>
                                <span className="iconify lucide--pilcrow-right size-4.5" />
                                <span className="hidden sm:inline">右到左</span>
                                <span className="inline sm:hidden">RTL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
