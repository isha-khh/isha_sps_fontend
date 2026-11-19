"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
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
  // 語音驗證碼（後端 `GET /api/captcha/audio/{id}`，後台「驗證碼設定」的 `enableAudio` 控制）：
  // 視障使用者看不到圖片，按鈕會把驗證碼的數字念出來；沒開就不顯示按鈕。無障礙檢測 GN1110111E 要求要有不同形式的替代驗證。
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  async function playAudio() {
    if (!captchaId || audioLoading) return;
    stopAudio();
    setAudioLoading(true);
    setAudioStatus("");
    try {
      // 用 apiClient 抓成 blob 再播放：網址、basePath、cookie 都跟其他 API 走同一條路，不用自己拼
      const response = await apiClient.get<Blob>(`/api/captcha/audio/${captchaId}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = stopAudio;
      await audio.play();
      setAudioStatus("正在播放語音驗證碼");
    } catch {
      setAudioStatus("語音驗證碼播放失敗，請按「更換驗證碼」後再試一次");
    } finally {
      setAudioLoading(false);
    }
  }

  async function load() {
    stopAudio();
    setAudioStatus("");
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
    // 語音開關是全站共用的圖片驗證碼設定，各場景一樣，用登入場景查一次就好
    captchaApi
      .getPublicSettings("member-login")
      .then((settings) => setAudioEnabled(Boolean(settings.enableAudio)))
      .catch(() => setAudioEnabled(false));
    return stopAudio;
    // 只在掛載時拿第一組，不需要依賴陣列
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        aria-describedby={audioEnabled ? "captcha-audio-hint" : undefined}
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
      {audioEnabled && (
        <>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm ms-2 flex-shrink-0"
            onClick={() => void playAudio()}
            disabled={loading || audioLoading || !captchaId}
            title="播放語音驗證碼"
          >
            <i className="bi bi-volume-up me-1" aria-hidden="true"></i>
            語音
          </button>
          <span id="captcha-audio-hint" className="visually-hidden">
            看不到圖片的話，可以按「語音」按鈕聽驗證碼的數字，再輸入到這個欄位。
          </span>
          <span className="visually-hidden" role="status" aria-live="polite">
            {audioStatus}
          </span>
        </>
      )}
    </div>
  );
});

export default CaptchaField;
