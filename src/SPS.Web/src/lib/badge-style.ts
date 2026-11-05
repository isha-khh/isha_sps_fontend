import type { CSSProperties } from "react";
import type { BadgeStyle } from "@/lib/types";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const valid = (value?: string | null): value is string => !!value && HEX_COLOR.test(value);

/**
 * 後台「分類管理／標籤管理」設的徽章顏色 → inline style，疊在預設樣式（`.badge-tag` 紫色、`ul.ul-key li a` 藍色漸層）上面：
 * - 底色：蓋掉預設底色（含藍色漸層）。
 * - 字體顏色：蓋掉預設白色。
 * - 外框顏色：加 1px 實線外框；只設底色沒設外框就不加。
 * 三個都沒設（或格式不是 #RRGGBB）回 undefined，完全維持原本樣式。顏色格式後端已驗證，這裡再擋一次，避免髒資料變成奇怪的 CSS。
 */
export function badgeInlineStyle(style?: BadgeStyle | null): CSSProperties | undefined {
  if (!style) return undefined;
  const result: CSSProperties = {};
  if (valid(style.badgeColor)) result.background = style.badgeColor;
  if (valid(style.badgeTextColor)) result.color = style.badgeTextColor;
  if (valid(style.badgeBorderColor)) result.border = `1px solid ${style.badgeBorderColor}`;
  return Object.keys(result).length > 0 ? result : undefined;
}

/** 內容（公告、服務專區…）標籤的徽章顏色，順序與 `item.tags`／`item.tagItems` 一致，給只有名稱陣列的卡片資料用 */
export function tagBadgesOf(item: { tagItems?: { badge?: BadgeStyle | null }[] }): (BadgeStyle | null | undefined)[] {
  return (item.tagItems ?? []).map((tag) => tag.badge);
}
