import { useEffect, useState, type FormEvent } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { footerLinksApi, type FooterLinksSettings } from '@/lib/api/footer-links';
import { siteCounterApi } from '@/lib/api/site-counter';
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

const CONTACT: FieldDef[] = [
  { key: 'contactAddress', label: '聯絡地址', placeholder: '813707 高雄市左營區博愛三路12號15樓' },
  {
    key: 'contactMapUrl',
    label: '地址的地圖連結',
    placeholder: 'https://maps.app.goo.gl/…',
    hint: '選填。有填的話，頁尾的地址會變成可點的連結；不填就只顯示文字。',
  },
  { key: 'contactPhone', label: '聯絡電話', placeholder: '+886-7-550-3115', hint: '前台會轉成可撥打的電話連結（只取數字與開頭的 +）。' },
  { key: 'contactEmail', label: '聯絡信箱', placeholder: 'name@example.com' },
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
  contactAddress: '',
  contactMapUrl: '',
  contactPhone: '',
  contactEmail: '',
};

/**
 * 頁尾連結管理。前台頁尾的「功能專區」、社群（LINE／Facebook／Instagram／YouTube／Threads／Podcast）、
 * 標章連結原本全是設計稿遺留的 `#`（點了只會回到頁首）；現在由這裡維護。聯絡資訊（地址、電話、信箱）
 * 原本也寫死在頁尾，一併放在這裡。
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
  // 瀏覽人次：獨立儲存（不是頁尾連結設定的一部分），空字串＝這個欄位不改
  const [visitors, setVisitors] = useState('');
  const [pageViews, setPageViews] = useState('');
  const [counterNow, setCounterNow] = useState<{ totalVisitors: number; totalPageViews: number } | null>(null);
  const [isSavingCounter, setIsSavingCounter] = useState(false);

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
    siteCounterApi
      .getAdminCounter()
      .then((c) => {
        if (!cancelled) setCounterNow(c);
      })
      .catch(() => {
        // 計數器讀不到不影響連結設定，這張卡片就只是不顯示目前數字
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCounter = async () => {
    const parse = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(/[,\s]/g, '')));
    const totalVisitors = parse(visitors);
    const totalPageViews = parse(pageViews);
    if (totalVisitors === undefined && totalPageViews === undefined) {
      await notify.warning('請至少填一個要校正的數字');
      return;
    }
    if ([totalVisitors, totalPageViews].some((n) => n !== undefined && (!Number.isInteger(n) || n < 0))) {
      await notify.warning('數字必須是 0 以上的整數');
      return;
    }

    setIsSavingCounter(true);
    try {
      const updated = await siteCounterApi.setCounter({ totalVisitors, totalPageViews });
      setCounterNow(updated);
      setVisitors('');
      setPageViews('');
      await notify.success('已更新瀏覽人次，前台頁尾最多 1 分鐘後更新');
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '更新失敗');
    } finally {
      setIsSavingCounter(false);
    }
  };

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
              <h3 className="card-title text-lg">聯絡資訊（Contact Us）</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{CONTACT.map(renderField)}</div>
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

      {!isLoading && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-3">
            <h3 className="card-title text-lg">瀏覽人次（頁尾「瀏覽」數字）</h3>
            <p className="text-sm text-base-content/70">
              前台頁尾顯示的是累計的<strong>訪客數</strong>：每個新瀏覽器第一次來算一位，之後自動累計。
              如果要沿用舊站的累計數字，在這裡校正；只填要改的欄位，留空的不會動。
            </p>
            {counterNow && (
              <p className="text-sm">
                目前：訪客 <strong>{counterNow.totalVisitors.toLocaleString('en-US')}</strong>　頁面瀏覽{' '}
                <strong>{counterNow.totalPageViews.toLocaleString('en-US')}</strong>
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="counter-visitors">
                  <span className="label-text font-medium">累計訪客數（頁尾顯示的就是這個）</span>
                </label>
                <input
                  id="counter-visitors"
                  type="text"
                  inputMode="numeric"
                  className="input input-bordered w-full"
                  placeholder="例如 10781"
                  value={visitors}
                  onChange={(e) => setVisitors(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label" htmlFor="counter-pageviews">
                  <span className="label-text font-medium">累計頁面瀏覽數</span>
                </label>
                <input
                  id="counter-pageviews"
                  type="text"
                  inputMode="numeric"
                  className="input input-bordered w-full"
                  placeholder="例如 50000"
                  value={pageViews}
                  onChange={(e) => setPageViews(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-outline" onClick={handleSaveCounter} disabled={isSavingCounter}>
                {isSavingCounter ? <span className="loading loading-spinner loading-sm" /> : '校正數字'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
