"use client";

import { useEffect, useState } from "react";
import { useAllLoadingTasksReady, useLoadingTask } from "@/lib/loading-store";

/**
 * 客戶後來補充：首次造訪要「跑完整套」，明確講了 2.5 秒
 * （對應舊站原本 2 秒 + 0.5 秒淡出、剛好也是 2.5 秒的觀感）。
 *
 * 這裡拿來當「最短顯示時間」的下限，不是取代掉前面「等 DOM／Hero
 * 圖片／API 都完成」那套判斷——兩者是「都要滿足」的關係：正常網速下
 * DOM/Hero 圖片通常早就緒了，所以視覺上就是固定跑滿 2.5 秒，跟舊站
 * 體感一致；但如果哪次剛好圖片/API 真的超過 2.5 秒才回來，畫面還是
 * 會繼續等到真的準備好，不會像舊站那樣硬在 2.5 秒把 Loading 收掉、
 * 讓使用者看到內容跳來跳去的半成品畫面。
 */
const MIN_VISIBLE_MS = 2000;
/** 對應 `.loading.is-loaded` 的 CSS 淡出動畫時間，跟舊站一致，不是新加的等待 */
const FADE_OUT_MS = 500;
/**
 * 保險用的上限：如果哪個任務卡住沒有真的完成（例如以後接了 API、
 * 那支請求出錯又沒處理 catch），別讓 Loading 畫面永遠關不掉、把整個
 * 首頁擋住。這不是「固定秒數收起 Loading」的做法——正常情況下畫面
 * 會在遠早於這個時間就因為任務都完成而收起，這只是異常時的下限保護。
 */
const SAFETY_TIMEOUT_MS = 6000;
/** 判斷「這個 session 是不是已經看過首頁載入畫面了」用的 key */
const SESSION_STORAGE_KEY = "sps-home-loading-shown";

/**
 * 首頁載入畫面。跟原本「固定等 2 秒」的做法不同，現在是等
 * `lib/loading-store.ts` 裡登記的任務都完成：
 * - `dom`：這個元件自己的 effect 有跑到，代表主要畫面已經掛上 DOM
 * - `heroImage`：Banner 主視覺圖真的載入完成（見 ui/HeroImage.tsx）
 * - 之後如果首頁哪塊改成打真的 API，資料元件可以自己登記
 *   `useLoadingTask("apiData:xxx")`，這裡完全不用改
 *
 * 全部任務完成 **而且** 至少已經顯示了 `MIN_VISIBLE_MS`，才會開始
 * 淡出——兩個條件都要滿足，避免「東西剛好都馬上載完，畫面閃一下
 * 就不見」的觀感問題。
 *
 * 客戶後續補充：這個畫面只有「首次」要跑完整套流程；同一個 session
 * 之後不管是切到別的內頁再切回首頁、還是其他地方觸發的載入狀態，
 * 都不應該再跑一次這個全螢幕 Loading——那些之後如果有，應該是各自
 * 元件根據自己那支 API 請求的狀態，各自處理局部的載入樣式（例如卡片
 * 區塊自己顯示 skeleton），不是共用這支全螢幕的。
 *
 * 「這個 session 是不是已經顯示過」用 `sessionStorage` 記錄（分頁/
 * 瀏覽器關掉重開就會重置，符合「首次」通常指的是「這次造訪」，不是
 * 「這台電腦有史以來只顯示一次」）。這個判斷刻意放在 mount 後的
 * effect 裡才做，不是在第一次 render 就同步判斷：伺服器端沒有
 * sessionStorage 可以讀，一定會先假設「是第一次」畫出載入畫面，如果
 * 硬是在 client 第一次 render 就用不同結果，會變成 hydration 對不起來
 * （跟先前 bsnav/AOS 那次踩到的問題是同一種），所以只在 effect 裡事後
 * 補一個「其實看過了、提早關掉」的判斷。代價是同一個 session 內重新
 * 整頁（非點連結切換）造訪首頁時，理論上會有極短暫的畫面閃現，這是
 * 為了不要重踩 hydration 問題所做的取捨。
 */
export default function PageLoader() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [safetyTriggered, setSafetyTriggered] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [alreadyShownThisSession, setAlreadyShownThisSession] = useState(false);
  const allTasksReady = useAllLoadingTasksReady();
  const markDomReady = useLoadingTask("dom");

  useEffect(() => {
    markDomReady();
  }, [markDomReady]);

  useEffect(() => {
    // 用一個 0ms 的 timer 把 setState 包在 callback 裡呼叫，不要在 effect
    // 本體裡直接呼叫——這是 react-hooks 對「effect 裡直接 setState 可能
    // 觸發連鎖 render」那條規則要求的寫法，即使這裡的 setState 本來就是
    // 由外部系統（sessionStorage）的值決定，不是單純從別的 state 衍生。
    const timer = setTimeout(() => {
      try {
        if (sessionStorage.getItem(SESSION_STORAGE_KEY) === "1") {
          setAlreadyShownThisSession(true);
        } else {
          sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
        }
      } catch {
        // 無痕模式或瀏覽器擋掉 sessionStorage 時，就當作每次都是「首次」，
        // 寧可多跑一次載入畫面，也不要因為存取失敗而整個掛掉。
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const safety = setTimeout(() => setSafetyTriggered(true), SAFETY_TIMEOUT_MS);
    return () => clearTimeout(safety);
  }, []);

  const readyToFade = (allTasksReady && minTimeElapsed) || safetyTriggered;

  useEffect(() => {
    if (!readyToFade) return;
    const timer = setTimeout(() => setRemoved(true), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [readyToFade]);

  if (removed || alreadyShownThisSession) return null;

  return (
    <div className={`loading${readyToFade ? " is-loaded" : ""}`} id="pageLoading">
      <div className="load-wrapper">
        <div className="loadIcon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 414 385"
            width="240"
            height="120"
          >
            <g className="part-blue">
              <path
                style={{ fill: "#2467B2" }}
                d="M212.676,90.625l-92.624,92.629c16.897,16.902,44.303,16.902,61.195,0l29.425-29.424c24.703-24.704,64.759-24.704,89.463,0c24.692,24.697,24.692,64.748,0,89.451L183.06,360.352c16.903,16.892,44.297,16.892,61.195,0l119.073-119.074c24.698-24.693,24.698-64.749,0-89.452l-61.189-61.2C277.436,65.921,237.379,65.921,212.676,90.625z"
              />
              <path
                style={{ fill: "#2467B2" }}
                d="M327.173,89.065c17.822,0,32.266,14.443,32.266,32.261c0,17.822-14.443,32.266-32.266,32.266c-17.817,0-32.267-14.444-32.267-32.266C294.906,103.508,309.355,89.065,327.173,89.065z"
              />
            </g>

            <g className="part-cyan">
              <path
                style={{ fill: "#1891AF" }}
                d="M109.916,136.539L226.975,19.475c-16.892-16.893-44.292-16.893-61.19,0L46.717,138.539c-24.703,24.704-24.703,64.759,0,89.462l61.19,61.195c24.698,24.692,64.754,24.692,89.458,0l92.624-92.635c-16.892-16.903-44.292-16.903-61.189,0l-29.436,29.425c-24.698,24.703-64.754,24.703-89.457,0C85.213,201.293,85.213,161.242,109.916,136.539z"
              />
              <path
                style={{ fill: "#1891AF" }}
                d="M78.208,226.844c17.812,0,32.261,14.443,32.261,32.256c0,17.822-14.449,32.266-32.261,32.266c-17.822,0-32.266-14.443-32.266-32.266C45.942,241.287,60.386,226.844,78.208,226.844z"
              />
            </g>
          </svg>
        </div>

        <div className="loadLogo">
          <img className="img-fluid d-block" src="/images/all/logo.svg" alt="LOGO" />
        </div>
      </div>
    </div>
  );
}
