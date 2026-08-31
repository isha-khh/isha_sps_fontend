"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 積木元件：包 slick 輪播，對應舊站到處出現的 `.slider` + `$(...).slick({...})`。
 *
 * 跟 Tabs 不一樣，slick 不是「掛好 data 屬性就會動」的套件，一定要
 * 明確呼叫 `$(el).slick(options)` 才會初始化，所以這支一定要是 client
 * 元件、用 useEffect 在掛載後手動初始化，卸載時呼叫 `unslick` 收乾淨。
 *
 * 上一頁/下一頁/暫停播放的按鈕請用 `<CarouselControls carouselId={id} />`，
 * 這裡不接受 onClick 之類的寫法——原因寫在 CarouselControls 裡：
 * slick 在 `infinite:true` 時會複製投影片 DOM 來做無縫循環，複製出來的
 * 節點是純 DOM clone，不是 React render 出來的，React 的合成事件系統
 * 完全不認得它、onClick 不會被觸發。所以這裡改成用 `id` 屬性配上
 * document 層級的原生事件代理（見下方 handleControlClick），不管按鈕
 * 是原始投影片還是 slick 複製出來的，都能正確運作。
 */
export default function Carousel({
  id,
  slides,
  options = {},
  className = "",
}: {
  /** 這個輪播的唯一識別碼，要跟對應的 <CarouselControls carouselId={id}> 一致 */
  id: string;
  slides: ReactNode[];
  options?: Record<string, unknown>;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // slick 沒有公開 API 可以查「現在是不是播放中」，官方範例也是自己
  // 用一個變數記；預設值跟著 autoplay 選項走。
  const isPlayingRef = useRef(options.autoplay !== false);

  useEffect(() => {
    const $ = window.jQuery;
    const track = trackRef.current;
    if (!$ || !track) return;

    const $track = $(track);
    $track.slick({ arrows: false, ...options });

    function handleControlClick(event: MouseEvent) {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        `[data-carousel-id="${id}"][data-carousel-action]`,
      );
      if (!target) return;

      switch (target.dataset.carouselAction) {
        case "prev":
          $track.slick("slickPrev");
          break;
        case "next":
          $track.slick("slickNext");
          break;
        case "toggle-play": {
          const wasPlaying = isPlayingRef.current;
          $track.slick(wasPlaying ? "slickPause" : "slickPlay");
          isPlayingRef.current = !wasPlaying;
          // 通知所有 <CarouselControls carouselId={id}>（可能不只一份，
          // 例如同一顆輪播的每張投影片都各放了一份按鈕）更新播放圖示。
          document.dispatchEvent(
            new CustomEvent("carousel:playstate", { detail: { id, playing: !wasPlaying } }),
          );
          break;
        }
      }
    }

    // 修正：輪播初始化當下如果剛好在隱藏的 bootstrap tab-pane 裡，等該
    // 分頁真的顯示出來時要重新量一次尺寸，不然投影片寬度會算錯成 0。
    function handleTabShown() {
      if ($track.is(":visible")) {
        $track.slick("setPosition");
      }
    }

    document.addEventListener("click", handleControlClick);
    $(document).on(`shown.bs.tab.carousel-${id}`, handleTabShown);

    return () => {
      document.removeEventListener("click", handleControlClick);
      $(document).off(`.carousel-${id}`);
      if ($track.hasClass("slick-initialized")) {
        $track.slick("unslick");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className={`slider ${className}`.trim()} ref={trackRef}>
      {slides.map((slide, index) => (
        <div className="item" key={index}>
          {slide}
        </div>
      ))}
    </div>
  );
}
