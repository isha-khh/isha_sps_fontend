import type { CSSProperties } from "react";
import type { BadgeStyle } from "@/lib/types";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const valid = (value?: string | null): value is string => !!value && HEX_COLOR.test(value);

function luminance(hex: string): number {
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 徽章文字要至少 4.5:1（無障礙檢測 GN2140300E）：後台選的字體色對不上底色時，改用黑或白其中對比較高的 */
const MIN_CONTRAST = 4.5;
function readableTextColor(background: string, preferred?: string | null): string | undefined {
  const text = valid(preferred) ? preferred : "#FFFFFF"; // 沒設字體色時，預設樣式是白字
  if (contrastRatio(background, text) >= MIN_CONTRAST) return valid(preferred) ? preferred : undefined;
  return contrastRatio(background, "#000000") >= contrastRatio(background, "#FFFFFF") ? "#000000" : "#FFFFFF";
}

/**
 * 後台「分類管理／標籤管理」設的徽章顏色 → inline style，疊在預設樣式（`.badge-tag` 紫色、`ul.ul-key li a` 藍色漸層）上面：
 * - 底色：蓋掉預設底色（含藍色漸層）。
 * - 字體顏色：蓋掉預設白色；對比低於 4.5:1 時自動改成黑或白（資料不動，只在顯示時調整）。
 * - 外框顏色：加 1px 實線外框；只設底色沒設外框就不加。
 * 三個都沒設（或格式不是 #RRGGBB）回 undefined，完全維持原本樣式。顏色格式後端已驗證，這裡再擋一次，避免髒資料變成奇怪的 CSS。
 */
export function badgeInlineStyle(style?: BadgeStyle | null): CSSProperties | undefined {
  if (!style) return undefined;
  const result: CSSProperties = {};
  if (valid(style.badgeColor)) result.background = style.badgeColor;
  // 有設底色才檢查對比：字體色沒設就看預設白字，設了就看設的；不夠就換黑／白
  const textColor = valid(style.badgeColor) ? readableTextColor(style.badgeColor, style.badgeTextColor) : valid(style.badgeTextColor) ? style.badgeTextColor : undefined;
  if (textColor) result.color = textColor;
  if (valid(style.badgeBorderColor)) result.border = `1px solid ${style.badgeBorderColor}`;
  return Object.keys(result).length > 0 ? result : undefined;
}

/** 內容（公告、服務專區…）標籤的徽章顏色，順序與 `item.tags`／`item.tagItems` 一致，給只有名稱陣列的卡片資料用 */
export function tagBadgesOf(item: { tagItems?: { badge?: BadgeStyle | null }[] }): (BadgeStyle | null | undefined)[] {
  return (item.tagItems ?? []).map((tag) => tag.badge);
}
