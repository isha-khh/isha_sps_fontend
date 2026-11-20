/**
 * 網站快速鍵（HTML `accesskey`）的組合鍵，因作業系統與瀏覽器而不同（參考 MDN `accesskey`）：
 *
 * | 環境                              | 組合鍵                    |
 * | --------------------------------- | ------------------------- |
 * | Windows／Linux：Chrome、Edge、Opera | Alt ＋ 字母               |
 * | Windows／Linux：Firefox            | Alt ＋ Shift ＋ 字母      |
 * | macOS：Chrome、Edge、Firefox、Safari | Control ＋ Option ＋ 字母 |
 *
 * 手機、平板的觸控操作沒有快速鍵（外接實體鍵盤才有），所以只提示、不列組合鍵。
 * 偵測只用來「顯示對的提示」，不影響快速鍵本身的運作（那是瀏覽器處理的）。
 */

export type AccesskeyOs = "windows" | "mac" | "linux" | "ios" | "android" | "other";
export type AccesskeyBrowser = "chrome" | "edge" | "firefox" | "safari" | "opera" | "other";

export type AccesskeyEnvironment = {
    os: AccesskeyOs;
    browser: AccesskeyBrowser;
    /** 觸控裝置（手機、平板）：沒有實體鍵盤時不能用快速鍵 */
    touch: boolean;
    /** 組合鍵的修飾鍵，依序按住；字母另外接在後面 */
    modifiers: string[];
};

const OS_LABEL: Record<AccesskeyOs, string> = {
    windows: "Windows",
    mac: "macOS",
    linux: "Linux",
    ios: "iOS／iPadOS",
    android: "Android",
    other: "您的作業系統",
};

const BROWSER_LABEL: Record<AccesskeyBrowser, string> = {
    chrome: "Chrome",
    edge: "Edge",
    firefox: "Firefox",
    safari: "Safari",
    opera: "Opera",
    other: "您的瀏覽器",
};

export function osLabel(os: AccesskeyOs): string {
    return OS_LABEL[os];
}

export function browserLabel(browser: AccesskeyBrowser): string {
    return BROWSER_LABEL[browser];
}

/** 伺服器端渲染與還沒偵測到之前用的預設值（Windows 的 Chrome／Edge，最常見） */
export const DEFAULT_ACCESSKEY_ENVIRONMENT: AccesskeyEnvironment = {
    os: "windows",
    browser: "chrome",
    touch: false,
    modifiers: ["Alt"],
};

export function modifiersFor(os: AccesskeyOs, browser: AccesskeyBrowser): string[] {
    if (os === "mac" || os === "ios") return ["Control", "Option"];
    if (browser === "firefox") return ["Alt", "Shift"];
    return ["Alt"];
}

/** 依 User-Agent 與平台判斷作業系統、瀏覽器。`maxTouchPoints` 用來分辨「桌面版 Safari 的 iPad」與真的 Mac */
export function detectAccesskeyEnvironment(userAgent: string, platform = "", maxTouchPoints = 0): AccesskeyEnvironment {
    const ua = userAgent || "";

    let os: AccesskeyOs = "other";
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) os = "ios";
    else if (/Android/i.test(ua)) os = "android";
    else if (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua)) os = "mac";
    else if (/Win/i.test(platform) || /Windows/i.test(ua)) os = "windows";
    else if (/Linux|X11|CrOS/i.test(platform + ua)) os = "linux";

    let browser: AccesskeyBrowser = "other";
    if (/Edg(e|A|iOS)?\//i.test(ua)) browser = "edge";
    else if (/OPR\/|Opera/i.test(ua)) browser = "opera";
    else if (/Firefox\/|FxiOS\//i.test(ua)) browser = "firefox";
    else if (/Chrome\/|CriOS\/|Chromium\//i.test(ua)) browser = "chrome";
    else if (/Safari\//i.test(ua)) browser = "safari";

    return {
        os,
        browser,
        touch: os === "ios" || os === "android",
        modifiers: modifiersFor(os, browser),
    };
}

/** 組合鍵文字，例如 `Alt + U`、`Control + Option + U` */
export function formatAccesskey(modifiers: string[], key: string): string {
    return [...modifiers, key].join(" + ");
}
