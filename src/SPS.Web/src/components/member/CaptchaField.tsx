"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { captchaApi } from "@/lib/api/captcha";
import { CaptchaType, type CaptchaData } from "@/types/captcha";

export interface CaptchaFieldHandle {
  /** 表單送出當下呼叫，拿目前這組驗證碼——`code` 還沒填或圖片還沒載入完成會回傳 `null`，呼叫端可以用這個擋住送出 */
  getValue: () => CaptchaData | null;
  /** 送出失敗後呼叫，強制換一組新的圖——圖片驗證碼後端驗證過一次就會失效，繼續沿用舊的一定會再錯一次 */
  refresh: () => void;
}

/**
 * 積木元件：圖片驗證碼輸入框，取代舊站 login.html／forgot.html／
 * p02.html 共用的 `/images/all/chksum.jpg` 靜態死圖＋純展示輸入框。
 *
 * 這不是可以先跳過、之後再說的裝飾——實測真後端
 * `GET /api/captcha/settings?scenario=member-login` 回
 * `{enabled:true, captchaType:2}`（圖片驗證碼），`AuthController.Login`
 * 送出時真的會呼叫 `_captchaService.VerifyCaptchaAsync` 驗證這組
 * `captchaId`／`code`，驗證碼錯或沒帶會直接 400。`lib/api/captcha.ts`／
 * `types/captcha.ts` 這兩支檔案本來就有（跟這整個會員系統其他
 * scaffolding 一樣，寫好了但從沒被任何元件用過），這裡是第一個真的
 * 接上去的地方。
 *
 * 掛載時打一次 `POST /api/captcha/generate` 換一組
 * `{captchaId, imageBase64}`；圖片本身可以點擊重新整理（原本
 * `chksum.jpg` 是張死圖，看不清楚也沒地方換）。
 *
 * 用 `forwardRef` 曝露 `getValue()`／`refresh()`，不是用 `onChange`
 * 一路往上回報——表單只需要在送出當下讀「現在這組是什麼」，跟
 * `AdminWeb`／別的地方常見的「每個按鍵都要往上通知」不是同一種需求，
 * 用 ref 比較單純，也不用擔心呼叫端沒把 `onChange` 包 `useCallback`
 * 就造成無限重新 render。
 */
const CaptchaField = forwardRef<CaptchaFieldHandle>(function CaptchaField(_props, ref) {
  const [captchaId, setCaptchaId] = useState<string>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function load() {
    setLoading(true);
    setError(undefined);
    setCode("");
    try {
      const result = await captchaApi.generate();
      setCaptchaId(result.captchaId);
      setImageBase64(result.imageBase64);
    } catch {
      setError("驗證碼載入失敗，請點圖片重試");
      setCaptchaId(undefined);
      setImageBase64(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // 只在掛載時拿第一組，不需要依賴陣列
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => (captchaId && code ? { type: CaptchaType.ImageCode, captchaId, code } : null),
    refresh: load,
  }));

  return (
    <div className="msk_sdcv">
      <input
        type="text"
        className="form-control me-2"
        placeholder="請輸入驗證碼"
        required
        aria-required="true"
        aria-label="驗證碼"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        maxLength={10}
      />
      <button
        type="button"
        className="btn p-0 border-0 bg-transparent flex-shrink-0"
        onClick={load}
        title="看不清楚？點擊更換驗證碼"
        aria-label="更換驗證碼圖片"
        disabled={loading}
      >
        {imageBase64 ? (
          // 後端 `CaptchaGenerateResponse.ImageBase64` 回的本來就是完整的
          // `data:image/png;base64,...` data URI（不是單純的 base64
          // 內容），實測直接印出來確認過——不能再自己補一次
          // `data:image/png;base64,` 前綴，補了會變成雙重前綴、瀏覽器
          // 當作無效網址（`ERR_INVALID_URL`），圖完全顯示不出來。
          <img
            className="img-fluid d-block"
            src={imageBase64}
            alt="驗證碼圖片，看不清楚請點擊更換"
            style={{ height: 42 }}
          />
        ) : (
          <span className="text-muted small text-nowrap">{error ?? "載入中…"}</span>
        )}
      </button>
    </div>
  );
});

export default CaptchaField;
