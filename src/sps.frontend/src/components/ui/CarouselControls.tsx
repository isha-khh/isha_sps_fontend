"use client";

import { useEffect, useState } from "react";

/**
 * 積木元件：輪播的上一則／下一則／暫停播放按鈕，對應舊站到處出現的
 * `.custom_box`（`.custom-prev`／`.custom-next`／`.slick-play-pause-btn`）。
 *
 * 這裡**不用** onClick 直接操作輪播：舊站的用法常常把這組按鈕放在
 * *每一張投影片裡面*（例如服務專區，整張卡片含圖文跟按鈕是同一個
 * 滑動單位），而 slick 在 `infinite:true` 時會複製投影片 DOM 做無縫
 * 循環——複製出來的節點是純 DOM clone，React 完全不認得，onClick
 * 不會觸發（實測過，複製出來的按鈕點了沒反應）。
 *
 * 所以改成只標記 `data-carousel-action`／`data-carousel-id`，實際點擊
 * 交給 `<Carousel id={carouselId}>` 內部用原生 document 事件代理處理
 * ——原生事件代理不管節點是不是 clone 出來的都抓得到，這也是舊站
 * jQuery 版本原本就在用的模式（`$box.find('.custom-prev')` 本來就是
 * 對「當下 DOM 裡所有符合的元素」生效，不限定哪一個實例）。
 *
 * 暫停/播放圖示的狀態改用 `carousel:playstate` 自訂事件同步，這樣同一顆
 * 輪播就算放了好幾份 CarouselControls，圖示也不會各自轉、對不起來。
 *
 * 已知的小落差：這個同步只對「React 真的 render 出來的那幾份」有效；
 * slick 複製出來的那幾份 clone 圖示會停在複製當下的樣子，不會再更新
 * （clone 是純 DOM 快照，React 之後的更新本來就摸不到它）。不影響
 * 功能——不管點哪一份，動作永遠是對的——只是恰好切到 clone 那張投影片
 * 時，圖示可能顯示落後一步，點一下就會校正回來。
 */
export default function CarouselControls({
  carouselId,
  prevLabel = "上一則",
  nextLabel = "下一則",
}: {
  carouselId: string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    function handlePlayState(event: Event) {
      const { id, playing } = (event as CustomEvent<{ id: string; playing: boolean }>).detail;
      if (id === carouselId) {
        setIsPlaying(playing);
      }
    }

    document.addEventListener("carousel:playstate", handlePlayState);
    return () => document.removeEventListener("carousel:playstate", handlePlayState);
  }, [carouselId]);

  return (
    <div className="custom_box">
      <button type="button" className="custom-arrow custom-prev" aria-label={prevLabel} data-carousel-id={carouselId} data-carousel-action="prev">
        <i className="bi bi-chevron-left" aria-hidden="true"></i>
      </button>

      <button type="button" className="custom-arrow custom-next" aria-label={nextLabel} data-carousel-id={carouselId} data-carousel-action="next">
        <i className="bi bi-chevron-right" aria-hidden="true"></i>
      </button>

      <button
        type="button"
        className="slick-play-pause-btn"
        aria-label={isPlaying ? "暫停輪播" : "播放輪播"}
        aria-pressed={!isPlaying}
        data-carousel-id={carouselId}
        data-carousel-action="toggle-play"
      >
        <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`} aria-hidden="true"></i>
        <span className="visually-hidden">{isPlaying ? "暫停輪播" : "播放輪播"}</span>
      </button>
    </div>
  );
}
