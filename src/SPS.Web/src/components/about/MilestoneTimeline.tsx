"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { withBasePath } from "@/lib/api-client";

export interface Milestone {
  year: string;
  title: string;
  items: string[];
}

const DESKTOP_QUERY = "(min-width: 992px)";
// 對照設計稿 page/about/index.html 的 GSAP ScrollTrigger：
// `end: () => items.length * 400`——每個年份給 400px 的額外捲動距離。
const SCROLL_RUNWAY_PER_ITEM = 400;

/**
 * 「計畫歷程」捲動時間軸，對應設計稿 `.milestone-section`。設計稿原本
 * 用 GSAP + ScrollTrigger 做「桌機版 pin 住整個區塊＋攔截滑鼠滾輪、
 * 每滾一次跳一個年份」（`page/about/index.html` 內嵌 `<script>`，
 * `coreScript.js` 本身沒有這段——之前漏看了這段內嵌 script，誤以為
 * 設計稿完全沒給互動邏輯）。
 *
 * 這裡沒有照抄「攔截 wheel 事件、每次跳一步」這個做法，改用
 * `motion`（專案本來就有裝，只是還沒有地方在用）的 `useScroll` 讀取
 * 原生捲動進度，連續帶動 `.history-list` 位移──滑鼠滾輪、觸控板、
 * 觸控捲動都能正常運作，不用額外攔截/阻擋原生捲動事件（wheel-jacking
 * 在觸控裝置上其實無效，也常被視為不好的體驗）。「目前作用中的年份」
 * 一樣是離散切換（對照最近的項目），不是連續淡入淡出，維持跟設計稿
 * 一致的視覺效果。
 *
 * 桌機/手機分界（992px）跟設計稿 `ScrollTrigger.matchMedia` 的斷點
 * 一致——手機版設計稿本來就是整塊變回正常文件流（`style_rwd.css`
 * 那段 `!important` 覆蓋掉 sticky/位移/透明度），這裡對應不額外撐出
 * 捲動空間、也不套 sticky，直接讓內容自然往下排。
 *
 * `.elevator-box`（logo）原始 CSS 是 `position: fixed`，`.indicator-
 * pointer`（藍點）是 `position: absolute`。桌機版把 `.milestone-
 * section` 設成 `position: sticky` 之後，`position: fixed` 的元素完全
 * 不認這個祖先（fixed 只認會建立新 containing block 的
 * transform/filter/will-change 那幾種，單純 overflow+sticky 不算）
 * ——會一路對齊到瀏覽器視窗本身，不受 `.milestone-section` 的
 * `overflow: hidden` 裁切，導致還沒捲到這個區塊時，logo 已經穿模疊在
 * 最上面的跑馬燈標題上。一度想過用 JS 手動判斷「區塊是否進入視窗」來
 * 切換 `visibility` 補救，但那是繞遠路——真正的做法是讓它們跟藍點一樣
 * 改成 `position: absolute`，相對 `.milestone-section` 自己定位。這樣
 * 區塊還在正常文件流、還沒被捲到眼前時，它們自然就跟著區塊本身被
 * `overflow: hidden` 裁切在外，不用任何額外 JS 判斷；一旦區塊
 * sticky 貼住，看起來就等同原本 `position: fixed` 的效果（因為區塊
 * 本身這時候就是釘在 `top:0` 不動）。
 */
export default function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [offsets, setOffsets] = useState<number[]>(() => milestones.map(() => 0));
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useLayoutEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const updateMatch = () => setIsDesktop(mql.matches);
    updateMatch();
    mql.addEventListener("change", updateMatch);
    return () => mql.removeEventListener("change", updateMatch);
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const first = itemRefs.current[0];
      if (!first) return;
      setOffsets(itemRefs.current.map((el) => (el ? el.offsetTop - first.offsetTop : 0)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [milestones]);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const maxOffset = offsets[offsets.length - 1] ?? 0;
  const y = useTransform(scrollYProgress, [0, 1], [0, -maxOffset]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!isDesktop || offsets.length === 0) return;
    const currentY = progress * maxOffset;
    let nearest = 0;
    let nearestDistance = Infinity;
    offsets.forEach((offset, index) => {
      const distance = Math.abs(offset - currentY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  });

  return (
    <div ref={wrapperRef} style={isDesktop ? { height: `calc(100vh + ${milestones.length * SCROLL_RUNWAY_PER_ITEM}px)` } : undefined}>
      <div className="ab_list2 milestone-section" id="milestoneSection" style={isDesktop ? { position: "sticky", top: 0 } : undefined}>
        <div className="title-wrap title-wrap_md d-lg-none d-block">
          <div className="h3_tit">計畫歷程</div>
        </div>

        <div className="axis-line" />
        <div className="indicator-pointer" />
        <div className="elevator-box" style={isDesktop ? { position: "absolute" } : undefined}>
          <img className="img-fluid d-block" src={withBasePath("/images/all/ab_logo.svg")} aria-hidden="true" alt="" />
        </div>

        <div className="fixed-left">
          <div className="title-wrap">
            <div className="h3_tit">計畫歷程</div>
          </div>

          <div className="year-fixed-display" id="bigYear">
            {milestones[activeIndex]?.year}
          </div>
        </div>

        <div className="right-viewport">
          <motion.div className="history-list" id="historyList" style={{ y: isDesktop ? y : 0 }}>
            {milestones.map((milestone, index) => (
              <div
                className={`history-item${index === activeIndex ? " active" : ""}`}
                data-year={milestone.year}
                key={milestone.year}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                <h3 className="card-title">
                  {milestone.year} - <span>{milestone.title}</span>
                </h3>
                <ul className="card-list">
                  {milestone.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="s_round_6" aria-hidden="true">
          <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
        </div>
        <div className="s_round_3" aria-hidden="true">
          <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
        </div>
      </div>
    </div>
  );
}
