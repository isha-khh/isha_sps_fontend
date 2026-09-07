import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";

// 淺色主題列表（Nexus UI + DaisyUI 淺色）
export const lightThemes = [
    "light", "contrast", "material",
    "cupcake", "bumblebee", "emerald", "corporate", "retro", "cyberpunk",
    "valentine", "garden", "lofi", "pastel", "fantasy", "wireframe",
    "cmyk", "autumn", "acid", "lemonade", "winter", "nord"
] as const;

// 深色主題列表（僅 Nexus UI）
export const darkThemes = ["dark", "dim", "material-dark"] as const;

export type ILightTheme = (typeof lightThemes)[number];
export type IDarkTheme = (typeof darkThemes)[number];

export type IConfig = {
    lightTheme: ILightTheme;
    darkTheme: IDarkTheme;
    followSystem: boolean;
    manualMode: "light" | "dark";
    direction: "ltr" | "rtl";
    sidebarTheme: "light" | "dark";
    fontFamily: "default" | "dm-sans" | "inclusive" | "ar-one" | "wix";
    fullscreen: boolean;
};

const defaultConfig: IConfig = {
    lightTheme: "material",
    darkTheme: "material-dark",
    followSystem: true,
    manualMode: "light",
    direction: "ltr",
    fontFamily: "default",
    sidebarTheme: "light",
    fullscreen: false,
};

const useHook = () => {
    const [config, setConfig] = useLocalStorage<IConfig>("__NEXUS_CONFIG_v6.0__", defaultConfig);
    const htmlRef = useMemo(() => typeof window !== "undefined" && document.documentElement, []);

    // 監聽系統深色模式偏好
    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        const darkModeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        darkModeMedia.addEventListener("change", listener);
        return () => darkModeMedia.removeEventListener("change", listener);
    }, []);

    // 計算當前實際使用的主題
    const currentTheme = useMemo(() => {
        if (config.followSystem) {
            return systemPrefersDark ? config.darkTheme : config.lightTheme;
        }
        return config.manualMode === "dark" ? config.darkTheme : config.lightTheme;
    }, [config.followSystem, config.manualMode, config.lightTheme, config.darkTheme, systemPrefersDark]);

    // 當前是否為深色模式
    const isDarkMode = useMemo(() => {
        if (config.followSystem) {
            return systemPrefersDark;
        }
        return config.manualMode === "dark";
    }, [config.followSystem, config.manualMode, systemPrefersDark]);

    const updateConfig = useCallback(
        (changes: Partial<IConfig>) => {
            setConfig((config) => ({ ...config, ...changes }));
        },
        [setConfig],
    );

    const changeLightTheme = (lightTheme: ILightTheme) => {
        updateConfig({ lightTheme });
    };

    const changeDarkTheme = (darkTheme: IDarkTheme) => {
        updateConfig({ darkTheme });
    };

    const setFollowSystem = (followSystem: boolean) => {
        updateConfig({ followSystem });
    };

    const setManualMode = (manualMode: "light" | "dark") => {
        updateConfig({ manualMode });
    };

    const changeSidebarTheme = (sidebarTheme: IConfig["sidebarTheme"]) => {
        updateConfig({ sidebarTheme });
    };

    const changeFontFamily = (fontFamily: IConfig["fontFamily"]) => {
        updateConfig({ fontFamily });
    };

    const changeDirection = (direction: IConfig["direction"]) => {
        updateConfig({ direction });
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement != null) {
            document.exitFullscreen();
        } else if (htmlRef) {
            htmlRef.requestFullscreen();
        }
        updateConfig({ fullscreen: !config.fullscreen });
    };

    const reset = () => {
        setConfig(defaultConfig);
        if (document.fullscreenElement != null) {
            document.exitFullscreen();
        }
    };

    const calculatedSidebarTheme = useMemo(() => {
        return config.sidebarTheme == "dark" && !isDarkMode ? "dark" : undefined;
    }, [config.sidebarTheme, isDarkMode]);

    useEffect(() => {
        const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");
        const fullscreenListener = () => {
            updateConfig({ fullscreen: fullscreenMedia.matches });
        };
        fullscreenMedia.addEventListener("change", fullscreenListener);

        return () => {
            fullscreenMedia.removeEventListener("change", fullscreenListener);
        };
    }, [config, updateConfig]);

    useEffect(() => {
        if (!htmlRef) return;

        htmlRef.setAttribute("data-theme", currentTheme);
        htmlRef.setAttribute("data-mode", isDarkMode ? "dark" : "light");

        if (config.fullscreen) {
            htmlRef.setAttribute("data-fullscreen", "");
        } else {
            htmlRef.removeAttribute("data-fullscreen");
        }
        if (config.sidebarTheme) {
            htmlRef.setAttribute("data-sidebar-theme", config.sidebarTheme);
        }
        if (JSON.stringify(config) !== JSON.stringify(defaultConfig)) {
            htmlRef.setAttribute("data-changed", "");
        } else {
            htmlRef.removeAttribute("data-changed");
        }
        if (config.fontFamily !== "default") {
            htmlRef.setAttribute("data-font-family", config.fontFamily);
        } else {
            htmlRef.removeAttribute("data-font-family");
        }
        if (config.direction) {
            htmlRef.dir = config.direction;
        }
    }, [config, currentTheme, isDarkMode, htmlRef]);

    return {
        config,
        currentTheme,
        isDarkMode,
        systemPrefersDark,
        calculatedSidebarTheme,
        changeLightTheme,
        changeDarkTheme,
        setFollowSystem,
        setManualMode,
        reset,
        changeSidebarTheme,
        changeFontFamily,
        changeDirection,
        toggleFullscreen,
    };
};

const ConfigContext = createContext({} as ReturnType<typeof useHook>);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    return <ConfigContext value={useHook()}>{children}</ConfigContext>;
};

export const useConfig = () => {
    return useContext(ConfigContext);
};
