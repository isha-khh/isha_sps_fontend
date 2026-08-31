"use client";

import { useEffect, useRef } from "react";
import { useLoadingTask } from "@/lib/loading-store";

/**
 * 積木元件：需要讓首頁 Loading 畫面等待的圖片（目前是 Banner 的主視覺）。
 * 掛載時登記一項 loading 任務，圖片載入完成（或失敗）時標記完成——
 * 失敗也要標記完成，不然圖片壞掉/404 時 Loading 畫面會永遠關不掉。
 *
 * 另外處理「圖片其實已經在瀏覽器快取裡」的情況：這種時候瀏覽器不會
 * 再觸發一次 `onLoad`，所以掛載時額外檢查 `img.complete`。
 */
export default function HeroImage({
  src,
  alt,
  className,
  taskKey = "heroImage",
}: {
  src: string;
  alt: string;
  className?: string;
  taskKey?: string;
}) {
  const markReady = useLoadingTask(taskKey);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      markReady();
    }
  }, [markReady]);

  return <img ref={imgRef} className={className} src={src} alt={alt} onLoad={markReady} onError={markReady} />;
}
