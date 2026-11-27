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
  /** 驗證碼沒填時，把鍵盤焦點帶到輸入框 */
  focus: () => void;
}

export interface CaptchaFieldProps {
  /** 輸入框的 id：給外面的 `<label htmlFor>` 用（沒給就退回用 aria-label 命名） */
  id?: string;
  /** 欄位目前有錯誤：設 `aria-invalid` */
  invalid?: boolean;
  /** 錯誤訊息元素的 id：用 `aria-describedby` 跟輸入框關聯 */
  errorId?: string;
  /** 使用者開始輸入時通知外面（清掉這個欄位的錯誤訊息） */
  onInput?: () => void;
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
const CaptchaField = forwardRef<CaptchaFieldHandle, CaptchaFieldProps>(function CaptchaField({ id, invalid, errorId, onInput }, ref) {
  const [captchaId, setCaptchaId] = useState<string>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  // 語音驗證碼（後端 `GET /api/captcha/audio/{id}`，後台「驗證碼設定」的 `enableAudio` 控制）：
  // 視障使用者看不到圖片，按鈕會把驗證碼的數字念出來；沒開就不顯示按鈕。無障礙檢測 GN1110111E 要求要有不同形式的替代驗證。
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function stopAudio() {
    const audio = audioRef.current;
    audioRef.current = null;
    if (!audio) return;
    audio.onplaying = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
  }

  /**
   * 播放語音驗證碼。**`play()` 一定要在點擊的同一個動作裡直接呼叫**：Safari 與部分瀏覽器的自動播放規則，
   * 要求 `play()` 由使用者手勢「同步」觸發，先 `await` 抓檔案（axios 抓成 blob）再播會被當成自動播放而靜音擋掉，
   * 實測下載下來的 WAV 能聽、網頁上按了卻沒聲音就是這個原因。所以這裡直接把音檔網址交給 `Audio`，瀏覽器自己串流。
   * 網址用 apiClient 的 baseURL（含 basePath）拼，跟其他 API 同一條路；音檔端點是匿名的，不需要 cookie 或標頭。
   */
  function playAudio() {
    if (!captchaId) return;
    stopAudio();
    setAudioFailed(false);
    setAudioStatus("");
    setAudioLoading(true);

    const base = (apiClient.defaults.baseURL ?? "").replace(/\/+$/, "");
    const audio = new Audio(`${base}/api/captcha/audio/${captchaId}`);
    audioRef.current = audio;
    audio.onplaying = () => {
      setAudioLoading(false);
      setAudioStatus("正在播放語音驗證碼");
    };
    audio.onended = () => {
      setAudioStatus("");
      stopAudio();
    };
    audio.onerror = () => {
      setAudioLoading(false);
      setAudioFailed(true);
      setAudioStatus("語音驗證碼載入失敗，請按「更換驗證碼」後再試一次");
    };

    audio.play().catch((error: unknown) => {
      // 被瀏覽器擋下（例如網站被設成不能自動播放聲音）或載入失敗；onerror 已經處理載入失敗，這裡處理被擋
      if (audioRef.current !== audio) return;
      setAudioLoading(false);
      setAudioFailed(true);
      setAudioStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "瀏覽器擋下了聲音播放，請檢查這個網站的聲音權限後再按一次"
          : "語音驗證碼播放失敗，請按「更換驗證碼」後再試一次",
      );
    });
  }

  async function load() {
    stopAudio();
    setAudioStatus("");
    setAudioFailed(false);
    setAudioLoading(false);
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
    focus: () => inputRef.current?.focus(),
  }));

  const describedBy = [audioEnabled ? "captcha-audio-hint" : null, invalid ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="msk_sdcv">
      <input
        ref={inputRef}
        type="text"
        id={id}
        className="form-control me-2"
        placeholder="請輸入驗證碼"
        required
        aria-required="true"
        aria-label={id ? undefined : "驗證碼"}
        aria-invalid={invalid ? true : undefined}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          onInput?.();
        }}
        autoComplete="off"
        maxLength={10}
        aria-describedby={describedBy}
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
            onClick={playAudio}
            disabled={loading || audioLoading || !captchaId}
            title="播放語音驗證碼"
          >
            <i className="bi bi-volume-up me-1" aria-hidden="true"></i>
            語音
          </button>
          <span id="captcha-audio-hint" className="visually-hidden">
            看不到圖片的話，可以按「語音」按鈕聽驗證碼的數字，再輸入到這個欄位。
          </span>
          {/* 播放狀態：失敗時要看得到（之前只放在隱藏文字，使用者看不到為什麼沒聲音），成功播放時只給輔助科技念 */}
          <span className={audioFailed ? "small text-danger ms-2" : "visually-hidden"} role={audioFailed ? "alert" : "status"} aria-live="polite">
            {audioStatus}
          </span>
        </>
      )}
    </div>
  );
});

export default CaptchaField;
