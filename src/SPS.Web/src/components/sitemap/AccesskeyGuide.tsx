"use client";

import { Fragment, useEffect, useState } from "react";
import {
  DEFAULT_ACCESSKEY_ENVIRONMENT,
  browserLabel,
  detectAccesskeyEnvironment,
  formatAccesskey,
  modifiersFor,
  osLabel,
  type AccesskeyEnvironment,
} from "@/lib/accesskey";

const ACCESSKEYS: { key: string; desc: string }[] = [
  { key: "U", desc: "在上方功能區塊，快速瀏覽網頁：網站導覽、聯絡資訊、字體調整等。" },
  { key: "C", desc: "中央內容區塊，為主要互動內容區。" },
  { key: "B", desc: "下方功能區塊。" },
  { key: "S", desc: "全站搜尋：開啟搜尋框並把游標放進去，輸入關鍵字後按 Enter 搜尋。" },
];

/** 全部環境的對照（偵測不到、或使用者想看別的環境時用） */
const REFERENCE: { env: string; modifiers: string[] }[] = [
  { env: "Windows、Linux：Chrome、Edge、Opera", modifiers: modifiersFor("windows", "chrome") },
  { env: "Windows、Linux：Firefox", modifiers: modifiersFor("windows", "firefox") },
  { env: "macOS：Chrome、Edge、Firefox、Safari", modifiers: modifiersFor("mac", "safari") },
];

/**
 * 「快速鍵設定說明」的快速鍵清單。組合鍵因作業系統與瀏覽器而不同（Windows 是 Alt、Firefox 要加 Shift、
 * Mac 是 Control + Option），頁面在瀏覽器端偵測使用者的環境，直接顯示對的按鍵；偵測前（含伺服器端渲染）
 * 先顯示 Windows 的 Chrome／Edge 預設，下方另有完整對照表，偵測錯誤也看得到正確組合。
 * 手機、平板沒有實體鍵盤時不能用快速鍵，只提示。
 */
export default function AccesskeyGuide() {
  const [env, setEnv] = useState<AccesskeyEnvironment>(DEFAULT_ACCESSKEY_ENVIRONMENT);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setEnv(detectAccesskeyEnvironment(nav.userAgent, nav.userAgentData?.platform || nav.platform || "", nav.maxTouchPoints || 0));
    setDetected(true);
  }, []);

  return (
    <>
      <dl className="accesskey_list">
        {ACCESSKEYS.map(({ key, desc }) => (
          <div className="accesskey_row" key={key}>
            <dt className="accesskey_key">
              {[...env.modifiers, key].map((k, index) => (
                <Fragment key={`${k}-${index}`}>
                  {index > 0 && " + "}
                  <kbd>{k}</kbd>
                </Fragment>
              ))}
            </dt>
            <dd className="accesskey_desc">{desc}</dd>
          </div>
        ))}
      </dl>

      <div className="browser_tip" role="note">
        <i className="bi bi-info-circle me-2" aria-hidden="true" />
        <span>
          {detected && env.touch
            ? "您目前使用的是手機或平板，觸控操作沒有快速鍵；外接實體鍵盤時，可以依下方對照表按對應的組合鍵。"
            : detected
              ? `偵測到您使用的是 ${osLabel(env.os)} 的 ${browserLabel(env.browser)}，請同時按住 ${env.modifiers.join(" + ")}，再按快速鍵的字母（例如 ${formatAccesskey(env.modifiers, "U")}）。若沒有反應，請對照下方表格，不同瀏覽器的組合鍵不一樣。`
              : "快速鍵的組合鍵因作業系統與瀏覽器而不同，請對照下方表格。"}
        </span>
      </div>

      <div className="table-responsive mt-3">
        <table className="table table-sm align-middle mb-0 accesskey_reference">
          <caption className="caption-top fw-bold">各瀏覽器的快速鍵組合（字母請換成上面的 U、C、B、S）</caption>
          <thead>
            <tr>
              <th scope="col">作業系統與瀏覽器</th>
              <th scope="col">組合鍵</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCE.map(({ env: label, modifiers }) => (
              <tr key={label}>
                <th scope="row" className="fw-normal">
                  {label}
                </th>
                <td>{formatAccesskey(modifiers, "字母")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
