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

    // slick 的 accessibility 會把「目前這一張投影片」整個設成 `tabindex="0"`：Tab 會先停在一個沒有名稱的整張投影片上，
    // 而它的焦點框又被輪播容器的 `overflow: hidden` 整個切掉，畫面上看起來「焦點消失了」，下一次 Tab 才進到裡面的連結。
    // 投影片本身不是互動元素，只讓裡面的連結／按鈕可以 Tab（slick 對它們的 tabindex 管理照舊）。
    // slick 每次換張都會重設一次，所以每個事件之後都再收一次。
    // 另外，slick 換張時會把「作用中投影片」裡所有 a／button 的 tabindex 一律改回 0，連原始碼裡刻意設 `tabindex="-1"` ＋
    // `aria-hidden="true"` 的重複連結（縮圖連結、隱藏的「查看更多」，無障礙檢測 HM1240402E）也被改回來：
    // 鍵盤會停在一個輔助科技看不到的連結上，而且焦點框常被輪播容器切掉。所以同樣收回 -1。
    const releaseSlideFocus = () => {
      $track.find(".slick-slide").attr("tabindex", "-1");
      $track.find('a[aria-hidden="true"], button[aria-hidden="true"]').attr("tabindex", "-1");
    };
    $track.on("init.slidefocus reInit.slidefocus setPosition.slidefocus beforeChange.slidefocus afterChange.slidefocus breakpoint.slidefocus", () => {
      releaseSlideFocus();
      window.setTimeout(releaseSlideFocus, 0);
    });

    $track.slick({ arrows: false, ...options });
    releaseSlideFocus();

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

    // 鍵盤焦點在輪播裡面時暫停自動換張（無障礙：2.2.2 暫停、停止、隱藏；2.4.7 焦點可視）。
    // slick 自己有 `pauseOnFocus`，但實測焦點停在投影片裡的連結時輪播照樣每 3 秒換張（它的 focussed 一直是 false），
    // 焦點所在的那張被換走、滑到畫面外，焦點框跟著消失，看起來像「選到就不見」。這裡自己補一層：
    // 焦點進到輪播內就暫停，離開輪播才恢復；使用者按過「暫停輪播」就維持暫停，不被焦點離開蓋掉。
    function handleFocusIn() {
      if (isPlayingRef.current) $track.slick("slickPause");
    }
    function handleFocusOut(event: FocusEvent) {
      if (event.relatedTarget instanceof Node && track!.contains(event.relatedTarget)) return;
      if (isPlayingRef.current) $track.slick("slickPlay");
    }
    track.addEventListener("focusin", handleFocusIn);
    track.addEventListener("focusout", handleFocusOut);

    document.addEventListener("click", handleControlClick);
    $(document).on(`shown.bs.tab.carousel-${id}`, handleTabShown);

    return () => {
      track.removeEventListener("focusin", handleFocusIn);
      track.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("click", handleControlClick);
      $(document).off(`.carousel-${id}`);
      $track.off(".slidefocus");
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
