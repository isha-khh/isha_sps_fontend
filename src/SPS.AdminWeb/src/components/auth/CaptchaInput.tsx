import { useState, useEffect, useCallback } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { captchaApi } from '@/lib/api/captcha';
import type { CaptchaPublicSettings, CaptchaGenerateResponse, CaptchaData } from '@/types/captcha';
import { CaptchaType } from '@/types/captcha';

interface CaptchaInputProps {
  /** 場景名稱 */
  scenario: 'admin-login' | 'member-login' | 'member-register' | 'forgot-password';
  /** 驗證碼資料變更回調 */
  onChange: (data: CaptchaData | null) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export const CaptchaInput = ({ scenario, onChange, disabled }: CaptchaInputProps) => {
  const [settings, setSettings] = useState<CaptchaPublicSettings | null>(null);
  const [captchaData, setCaptchaData] = useState<CaptchaGenerateResponse | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 載入 CAPTCHA 設定
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const publicSettings = await captchaApi.getPublicSettings(scenario);
        setSettings(publicSettings);

        // 如果啟用圖片驗證碼，自動生成一組
        if (publicSettings.enabled && publicSettings.captchaType === CaptchaType.ImageCode) {
          await refreshCaptcha();
        }
      } catch (err) {
        console.error('Failed to load captcha settings:', err);
        // 如果載入失敗，假設不需要驗證碼
        setSettings({ enabled: false, captchaType: CaptchaType.None, enableAudio: false });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [scenario]);

  // 刷新圖片驗證碼
  const refreshCaptcha = useCallback(async () => {
    try {
      setError('');
      const data = await captchaApi.generate();
      setCaptchaData(data);
      setCaptchaCode('');
      onChange(null); // 清除之前的驗證碼資料
    } catch (err) {
      setError('無法載入驗證碼，請重試');
      console.error('Failed to generate captcha:', err);
    }
  }, [onChange]);

  // 當驗證碼輸入變更時，更新父組件
  useEffect(() => {
    if (!settings?.enabled) {
      onChange(null);
      return;
    }

    if (settings.captchaType === CaptchaType.ImageCode && captchaData && captchaCode) {
      onChange({
        type: CaptchaType.ImageCode,
        captchaId: captchaData.captchaId,
        code: captchaCode,
      });
    } else if (settings.captchaType === CaptchaType.Turnstile) {
      // Turnstile 由 onTurnstileCallback 處理
    } else {
      onChange(null);
    }
  }, [settings, captchaData, captchaCode, onChange]);

  // Turnstile 成功回調
  const handleTurnstileSuccess = useCallback((token: string) => {
    onChange({
      type: CaptchaType.Turnstile,
      turnstileToken: token,
    });
  }, [onChange]);

  // Turnstile 過期回調
  const handleTurnstileExpire = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Turnstile 錯誤回調
  const handleTurnstileError = useCallback(() => {
    setError('人機驗證失敗，請重試');
    onChange(null);
  }, [onChange]);

  // 播放音訊驗證碼
  const playAudio = () => {
    if (captchaData) {
      const audio = new Audio(captchaApi.getAudioUrl(captchaData.captchaId));
      audio.play().catch(console.error);
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <span className="loading loading-spinner loading-sm" />
      </div>
    );
  }

  // 未啟用驗證碼
  if (!settings?.enabled) {
    return null;
  }

  // 圖片驗證碼
  if (settings.captchaType === CaptchaType.ImageCode) {
    return (
      <fieldset className="fieldset">
        <legend className="fieldset-legend">驗證碼</legend>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {captchaData ? (
              <img
                src={captchaData.imageBase64}
                alt="驗證碼"
                className="h-12 rounded border border-base-300"
              />
            ) : (
              <div className="h-12 w-32 bg-base-200 rounded animate-pulse" />
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={refreshCaptcha}
              disabled={disabled}
              title="重新產生驗證碼"
            >
              <span className="iconify lucide--refresh-cw size-4" />
            </button>
            {settings.enableAudio && captchaData && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle"
                onClick={playAudio}
                disabled={disabled}
                title="播放音訊驗證碼"
              >
                <span className="iconify lucide--volume-2 size-4" />
              </button>
            )}
          </div>
          <label className="input w-full focus:outline-0">
            <span className="iconify lucide--shield-check text-base-content/80 size-5"></span>
            <input
              className="grow focus:outline-0"
              placeholder="請輸入驗證碼"
              type="text"
              maxLength={8}
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              disabled={disabled}
            />
          </label>
          {error && (
            <p className="text-error text-xs">{error}</p>
          )}
        </div>
      </fieldset>
    );
  }

  // Turnstile
  if (settings.captchaType === CaptchaType.Turnstile && settings.turnstileSiteKey) {
    return (
      <fieldset className="fieldset">
        <legend className="fieldset-legend">人機驗證</legend>
        <Turnstile
          siteKey={settings.turnstileSiteKey}
          onSuccess={handleTurnstileSuccess}
          onExpire={handleTurnstileExpire}
          onError={handleTurnstileError}
          options={{
            theme: 'auto',
          }}
        />
        {error && (
          <p className="text-error text-xs mt-2">{error}</p>
        )}
      </fieldset>
    );
  }

  return null;
};
