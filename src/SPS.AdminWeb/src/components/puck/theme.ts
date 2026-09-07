// Puck 編輯器 / 渲染器主題：固定亮色，對齊前台白底配色
//
// 設計理念：Puck 編輯器中央 canvas 與渲染輸出代表「前台呈現結果」，前台主題固定白底深字，
// 因此這份色票不跟後台主題切換。後台的暗色主題只影響編輯器周邊 chrome（toolbar / sidebar / 欄位）
// 由 styles/plugins/puck.css 控制。
//
// WCAG AAA 對比度 ≥ 7:1（與白色背景）

export const colors = {
  // 主要文字色
  textPrimary: "#1a1a1a", // 對比度 ~16:1
  textSecondary: "#3d3d3d", // 對比度 ~10:1
  textMuted: "#525252", // 對比度 ~7:1

  // 背景色
  bgPrimary: "#ffffff",
  bgSecondary: "#f8f9fa",
  bgTertiary: "#e9ecef",

  // 強調色（與白底對比 ≥ 7:1）
  accent: "#0055a5",
  accentHover: "#003d75",
  accentFocus: "#002855",

  // 狀態色（與白底對比 ≥ 7:1）
  success: "#0a6b3c",
  warning: "#7a4d00",
  error: "#a51818",
  info: "#0055a5",

  // 邊框
  border: "#6c757d",
  borderLight: "#adb5bd",
};
