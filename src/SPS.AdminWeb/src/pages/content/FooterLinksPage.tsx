import { useEffect, useState, type FormEvent } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { footerLinksApi, type FooterLinksSettings } from '@/lib/api/footer-links';
import { useNotify } from '@/hooks/useNotify';

interface FieldDef {
  key: keyof FooterLinksSettings;
  label: string;
  placeholder: string;
  hint?: string;
}

const FUNCTION_ZONE: FieldDef[] = [
  {
    key: 'functionZoneUrl',
    label: '功能專區',
    placeholder: '/serve 或 https://…',
    hint: '頁尾「網站導覽」欄的「功能專區」連結。可以填站內路徑（以 / 開頭，例如 /serve）或 http／https 網址。',
  },
];

const SOCIALS: FieldDef[] = [
  { key: 'lineUrl', label: 'LINE 官方帳號', placeholder: 'https://line.me/R/ti/p/…' },
  { key: 'facebookUrl', label: 'Facebook 粉絲專頁', placeholder: 'https://www.facebook.com/…' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://www.instagram.com/…' },
  { key: 'youTubeUrl', label: 'YouTube', placeholder: 'https://www.youtube.com/@…' },
  { key: 'threadsUrl', label: 'Threads', placeholder: 'https://www.threads.net/@…' },
  { key: 'podcastUrl', label: 'Podcast', placeholder: 'https://…' },
];

const BADGES: FieldDef[] = [
  {
    key: 'accessibilityBadgeUrl',
    label: '無障礙網頁標章 2.0',
    placeholder: 'https://accessibility.moda.gov.tw/…',
    hint: '點標章後前往的檢測／證書網址。不填就只顯示標章圖片、沒有連結。',
  },
  { key: 'idaUrl', label: '經濟部產業發展署', placeholder: 'https://www.ida.gov.tw/' },
  { key: 'ishaUrl', label: '工業安全衛生協會', placeholder: 'https://…' },
];

const EMPTY: FooterLinksSettings = {
  functionZoneUrl: '',
  lineUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youTubeUrl: '',
  threadsUrl: '',
  podcastUrl: '',
  accessibilityBadgeUrl: '',
  idaUrl: '',
  ishaUrl: '',
};

/**
 * 頁尾連結管理。前台頁尾的「功能專區」、社群（LINE／Facebook／Instagram／YouTube／Threads／Podcast）、
 * 標章連結原本全是設計稿遺留的 `#`（點了只會回到頁首）；現在由這裡維護。
 *
 * 欄位留空＝前台不顯示該項目（標章則只顯示圖片、不可點），不會再有假連結。
 * 網址只接受 http／https（功能專區另外可填站內路徑），後端會驗證並回錯誤訊息。
 * 前台頁尾有 5 分鐘快取，儲存後最多 5 分鐘才會看到。需要「網站內容管理」權限。
 */
export const FooterLinksPage = () => {
  const notify = useNotify();
  const [form, setForm] = useState<FooterLinksSettings>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    footerLinksApi
      .get()
      .then((data) => {
        if (!cancelled) setForm({ ...EMPTY, ...data });
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入頁尾連結設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await footerLinksApi.update(form);
      await notify.success('已儲存，前台頁尾最多 5 分鐘後更新');
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = ({ key, label, placeholder, hint }: FieldDef) => (
    <div className="form-control" key={key}>
      <label className="label" htmlFor={`footer-${key}`}>
        <span className="label-text font-medium">{label}</span>
      </label>
      <input
        id={`footer-${key}`}
        type="text"
        inputMode="url"
        className="input input-bordered w-full"
        placeholder={placeholder}
        maxLength={500}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {hint && <p className="text-xs text-base-content/60 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="頁尾連結"
        items={[
          { label: '內容管理', path: '/content/footer-links' },
          { label: '頁尾連結', active: true },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="alert">
            <span className="iconify lucide--info size-5" />
            <span>欄位留空，前台頁尾就不會顯示該項目。網址必須是 http／https 開頭。</span>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-3">
              <h3 className="card-title text-lg">導覽連結</h3>
              {FUNCTION_ZONE.map(renderField)}
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-3">
              <h3 className="card-title text-lg">社群連結</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{SOCIALS.map(renderField)}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-3">
              <h3 className="card-title text-lg">頁尾標章連結</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{BADGES.map(renderField)}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--save size-4" />
                  儲存
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
