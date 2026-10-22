"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

/**
 * 影音卡片裡「縮圖以外」的連結（標題區塊、「立即觀看」）。
 *
 * 一張卡片只能有一個元素掛 `data-fancybox`（見 FeaturedVideoCard.tsx「踩過的坑」），所以這些連結本身沒有燈箱屬性，
 * 單純 `href` 會直接開新分頁——直接上傳的影片檔，網址是 `/api/FileManagement/{id}/download`，瀏覽器就把它當檔案下載
 * （使用者回報「點立即觀看／卡片外框會下載檔案」）。
 *
 * `playOnSite` 為 true 時，改成點了去觸發同一張卡片的縮圖（`a.pic`，它掛了 `data-fancybox`），跟點縮圖一樣在頁面內播放；
 * 找不到縮圖或 `playOnSite` 為 false（後台關掉網站內播放）就照一般連結處理。JS 沒載入時仍是原本的連結行為。
 */
export default function VideoPlayLink({
  playOnSite,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { playOnSite: boolean }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !playOnSite) return;
    const pic = event.currentTarget.closest(".video-card, .item_box")?.querySelector<HTMLAnchorElement>("a.pic[data-fancybox]");
    if (!pic) return;
    event.preventDefault();
    pic.click();
  };
  return <a {...props} onClick={handleClick} />;
}
