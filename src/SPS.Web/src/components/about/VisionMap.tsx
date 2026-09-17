import fs from "node:fs";
import path from "node:path";

const SVG_PATH = path.join(process.cwd(), "public/images/about/taiwan-map.svg");
const svgMarkup = fs.readFileSync(SVG_PATH, "utf-8");

/**
 * 積木元件：「願景」區塊的台灣地圖，對應設計稿 `page/about/index.html`
 * 的 `.pic[data-aos="animate-svg"]`——紅色地標掉落進場、四支箭頭依序
 * 由地標「冒出來」的動畫（對照使用者提供的螢幕錄影逐格比對：箭頭是
 * 一支接一支「出現」，不是單支箭頭本身持續放大／循環——跟頁面其他
 * `data-aos="fade-up"` 一樣是進場播一次，不是無限循環）。
 *
 * 這張 SVG 本來是用 `<img src="taiwan-map.svg">` 引入（見
 * `about/page.tsx` 舊註解）：檔案很大（500+ 行路徑資料），塞進元件
 * 檔太肥。但 `<img>` 引入的 SVG 是不透明內容，外部 CSS／AOS 的
 * `.aos-animate` class 完全碰不到裡面的 `.map-pin`／`.arrow-flow`
 * 元素，動畫無從做起。改成直接讀檔內容用 `dangerouslySetInnerHTML`
 * 內嵌——SVG 原始碼完全沒改動（複雜路徑資料手動轉成 JSX 屬性風險太
 * 高，照抄字串最安全），只是換一種「引入」方式，讓它變成真正的頁面
 * DOM，CSS 才抓得到裡面的 class。
 *
 * 這個元件目前整個網站只用這一次，SVG 內部的 `id="SVGID_x_"`（漸層／
 * clipPath 參照用）沒有做防重複處理——同一頁如果之後真的要放兩份，
 * 這些 id 會撞在一起導致漸層/裁切失效，屆時需要另外處理。
 */
export default function VisionMap() {
  return (
    <div className="pic" data-aos="animate-svg" role="img" aria-label="台灣地圖">
      <div className="img-fluid" dangerouslySetInnerHTML={{ __html: svgMarkup }} />

      <style>{`
        .pic[data-aos="animate-svg"] .map-pin {
          opacity: 0;
          transform: translateY(-40px);
          transform-box: fill-box;
          transform-origin: center;
        }
        .pic[data-aos="animate-svg"] .map-pin-shadow {
          transform: scale(0.3);
          transform-box: fill-box;
          transform-origin: center;
        }
        .pic[data-aos="animate-svg"] .arrow-flow {
          opacity: 0;
          transform: scale(0.85);
          transform-box: fill-box;
          transform-origin: center;
        }

        .pic[data-aos="animate-svg"].aos-animate .map-pin {
          animation: about-map-pin-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
        }
        .pic[data-aos="animate-svg"].aos-animate .map-pin-shadow {
          animation: about-map-pin-shadow-grow 0.6s ease-out 0.4s forwards;
        }
        .pic[data-aos="animate-svg"].aos-animate .arrow-flow {
          animation: about-map-arrow-appear 0.5s ease-out forwards;
        }
        .pic[data-aos="animate-svg"].aos-animate .arrow-1 {
          animation-delay: 0.9s;
        }
        .pic[data-aos="animate-svg"].aos-animate .arrow-2 {
          animation-delay: 1.15s;
        }
        .pic[data-aos="animate-svg"].aos-animate .arrow-3 {
          animation-delay: 1.4s;
        }
        .pic[data-aos="animate-svg"].aos-animate .arrow-4 {
          animation-delay: 1.65s;
        }

        @keyframes about-map-pin-drop {
          0% { opacity: 0; transform: translateY(-40px); }
          60% { opacity: 1; transform: translateY(6px); }
          80% { transform: translateY(-3px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes about-map-pin-shadow-grow {
          0% { transform: scale(0.3); }
          100% { transform: scale(1); }
        }

        @keyframes about-map-arrow-appear {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .pic[data-aos="animate-svg"] .map-pin,
          .pic[data-aos="animate-svg"] .map-pin-shadow,
          .pic[data-aos="animate-svg"] .arrow-flow {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
