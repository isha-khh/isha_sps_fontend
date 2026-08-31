"use client";

import { useEffect, useState } from "react";

/**
 * 過渡期元件：原本是 index.html 裡的 loading 遮罩 + 一段 jQuery：
 *   setTimeout(() => $('.loading').addClass('is-loaded'), 2000)
 *   之後再 500ms 把整個 .loading 移除
 *
 * 這支已經是「結構轉 React，行為也順手改成原生 React」的示範——
 * class 名稱（loading / is-loaded）還是沿用舊站 CSS，之後真的要換版型
 * 時再一起處理就好。
 */
export default function PageLoader() {
  const [stage, setStage] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    const toFading = setTimeout(() => setStage("fading"), 2000);
    return () => clearTimeout(toFading);
  }, []);

  useEffect(() => {
    if (stage !== "fading") return;
    const toDone = setTimeout(() => setStage("done"), 500);
    return () => clearTimeout(toDone);
  }, [stage]);

  if (stage === "done") return null;

  return (
    <div className={`loading${stage === "fading" ? " is-loaded" : ""}`} id="pageLoading">
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
