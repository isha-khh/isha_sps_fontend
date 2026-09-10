"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 積木元件：會員註冊 Step1「使用條款」的兩個同意勾選框＋底部按鈕。
 *
 * 2026-09-10 使用者回報 bug：原本兩個勾選框完全沒有驗證，沒勾選也能
 * 直接按「同意，下一步」跳到 Step2——這是 git 歷史那版註解就寫明的
 * 已知缺口（「範圍確認後再補」），現在補上：兩個都勾選才能繼續，
 * 沒勾選時「同意，下一步」是不可點擊的灰色狀態（跟 `MemberTypeSelector.tsx`
 * 「下一步」按鈕在還沒選完會員類型時的不可點擊處理是同一套做法）。
 */
export default function MemberConsentGate() {
  const [agreedNotice, setAgreedNotice] = useState(false);
  const [agreedCollection, setAgreedCollection] = useState(false);
  const canProceed = agreedNotice && agreedCollection;

  return (
    <>
      <div className="peer_box">
        <div className="mb-3">
          <p>
            <i className="bi bi-exclamation-circle-fill me-1"></i>請確認您已詳閱並同意以下事項
          </p>
        </div>

        <div className="peer d-flex mb-3">
          <label className="relative">
            <input
              type="checkbox"
              aria-label="同意已充分知悉告知事項"
              title="本人已充分知悉貴署上述告知事項"
              className="form-check-input peer me-1"
              checked={agreedNotice}
              onChange={(e) => setAgreedNotice(e.target.checked)}
            />
          </label>
          <span>本人已充分知悉貴署上述告知事項。</span>
        </div>

        <div className="peer d-flex">
          <label className="relative">
            <input
              type="checkbox"
              aria-label="同意個人資料蒐集處理利用"
              title="本人同意貴署蒐集、處理、利用本人之個人資料"
              className="form-check-input peer me-1"
              checked={agreedCollection}
              onChange={(e) => setAgreedCollection(e.target.checked)}
            />
          </label>
          <span>本人同意貴署蒐集、處理、利用本人之個人資料，以及其他公務機關請求行政協助目的之提供。</span>
        </div>
      </div>

      <div className="card-footer d-flex justify-content-between">
        <Link className="btn-outline-dark" href="/" title="不同意,回首頁">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>不同意，回首頁
        </Link>
        {canProceed ? (
          <Link className="btn-theme" href="/member/register/account" title="同意，下一步">
            同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
          </Link>
        ) : (
          <span className="btn-theme" aria-disabled="true" title="請先勾選並同意上述兩項事項" style={{ opacity: 0.5, pointerEvents: "none" }}>
            同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
          </span>
        )}
      </div>
    </>
  );
}
