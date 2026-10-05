import { useEffect, useState, type FormEvent } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { pageSettingsApi, type ContributeFormatFile, type ContributePageSettings } from '@/lib/api/page-settings';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useNotify } from '@/hooks/useNotify';

type FormatKind = 'odt' | 'pdf';

const FORMATS: Record<FormatKind, { label: string; extension: string; hint: string }> = {
  odt: { label: 'ODF 格式（.odt）', extension: '.odt', hint: 'OpenDocument 文字文件，LibreOffice、WPS 等都能開啟。' },
  pdf: { label: 'PDF 格式（.pdf）', extension: '.pdf', hint: '前台可先閱讀填寫說明。' },
};

const EMPTY: ContributePageSettings = {
  odtFileId: null,
  pdfFileId: null,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

/** 從選到的檔案（檔案管理清單或剛上傳的）取出 id 與檔名 */
function pickedFile(file: FileListItem | FileUploadResponse): { id: string; name: string } {
  return 'fileId' in file ? { id: file.fileId, name: file.fileName } : { id: file.id, name: file.originalFileName };
}

/**
 * 頁面設定：前台各頁面可以在後台調整的內容。目前有「我要投稿」頁——
 * 投稿格式檔（ODF、PDF 各一個）與投稿聯絡資訊；之後其他頁面的設定也放在這一頁。
 *
 * 投稿格式檔從檔案管理系統挑（對話框可以直接上傳新檔案），前台「下載投稿格式」按鈕會開一個對話框，
 * 列出這裡設定好的格式讓使用者下載。沒有設定的格式不會出現；兩個都沒設定時前台顯示「投稿格式準備中」。
 * 副檔名必須對得上（ODF＝.odt、PDF＝.pdf），後端也會再檢查一次。
 *
 * 前台有 1 分鐘的快取，儲存後最多 1 分鐘才看得到。需要「網站內容管理」權限。
 */
export const PageSettingsPage = () => {
  const notify = useNotify();
  const [form, setForm] = useState<ContributePageSettings>(EMPTY);
  // 目前選到的檔案資訊（檔名、大小）；剛從對話框選的檔案還沒儲存前，先用選到的檔名顯示
  const [files, setFiles] = useState<Record<FormatKind, { name: string; size?: string } | null>>({ odt: null, pdf: null });
  const [pickerFor, setPickerFor] = useState<FormatKind | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const describe = (f: ContributeFormatFile | null) => (f ? { name: f.fileName, size: f.formattedFileSize } : null);

  useEffect(() => {
    let cancelled = false;
    pageSettingsApi
      .getContribute()
      .then((data) => {
        if (cancelled) return;
        setForm({ ...EMPTY, ...data.settings });
        setFiles({ odt: describe(data.odt), pdf: describe(data.pdf) });
      })
      .catch(async () => {
        if (!cancelled) await notify.error('載入頁面設定失敗');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (kind: FormatKind, file: FileListItem | FileUploadResponse) => {
    const { id, name } = pickedFile(file);
    const ext = FORMATS[kind].extension;
    if (!name.toLowerCase().endsWith(ext)) {
      await notify.warning(`「${FORMATS[kind].label}」必須選擇副檔名為 ${ext} 的檔案`);
      return;
    }
    setForm((prev) => ({ ...prev, [kind === 'odt' ? 'odtFileId' : 'pdfFileId']: id }));
    setFiles((prev) => ({ ...prev, [kind]: { name, size: 'formattedFileSize' in file ? file.formattedFileSize : undefined } }));
    setPickerFor(null);
  };

  const handleClear = (kind: FormatKind) => {
    setForm((prev) => ({ ...prev, [kind === 'odt' ? 'odtFileId' : 'pdfFileId']: null }));
    setFiles((prev) => ({ ...prev, [kind]: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await pageSettingsApi.updateContribute(form);
      await notify.success('已儲存，前台最多 1 分鐘後更新');
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFormat = (kind: FormatKind) => {
    const info = FORMATS[kind];
    const current = files[kind];
    return (
      <div className="rounded-box border border-base-300 p-4 space-y-2" key={kind}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold">{info.label}</h4>
          <span className={`badge ${current ? 'badge-success' : 'badge-ghost'}`}>{current ? '已設定' : '尚未設定'}</span>
        </div>
        <p className="text-xs text-base-content/60">{info.hint}</p>
        {current ? (
          <p className="text-sm flex items-center gap-2">
            <span className="iconify lucide--file size-4" />
            <span className="break-all">{current.name}</span>
            {current.size && <span className="text-base-content/60">（{current.size}）</span>}
          </p>
        ) : (
          <p className="text-sm text-base-content/60">前台不會顯示這個格式。</p>
        )}
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setPickerFor(kind)}>
            <span className="iconify lucide--folder-open size-4" />
            {current ? '更換檔案' : '選擇檔案'}
          </button>
          {current && (
            <button type="button" className="btn btn-sm btn-ghost text-error" onClick={() => handleClear(kind)}>
              <span className="iconify lucide--x size-4" />
              移除
            </button>
          )}
        </div>
      </div>
    );
  };

  const textField = (key: 'contactName' | 'contactPhone' | 'contactEmail', label: string, placeholder: string, hint?: string) => (
    <div className="form-control" key={key}>
      <label className="label" htmlFor={`page-${key}`}>
        <span className="label-text font-medium">{label}</span>
      </label>
      <input
        id={`page-${key}`}
        type="text"
        className="input input-bordered w-full"
        placeholder={placeholder}
        maxLength={key === 'contactEmail' ? 320 : 50}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {hint && <p className="text-xs text-base-content/60 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="頁面設定"
        items={[
          { label: '內容管理', path: '/content/page-settings' },
          { label: '頁面設定', active: true },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-4">
              <h3 className="card-title text-lg">我要投稿（前台 /promotion/contribute）</h3>
              <p className="text-sm text-base-content/70">
                前台「下載投稿格式」按鈕會開啟對話框，讓使用者選擇下載 ODF 或 PDF 格式。只有設定好的格式會出現；兩個都沒設定時，前台顯示「投稿格式準備中」。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFormat('odt')}
                {renderFormat('pdf')}
              </div>

              <div className="divider my-1" />

              <h4 className="font-semibold">投稿聯絡資訊</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {textField('contactName', '聯絡人', '例如 王小明', '留空前台不顯示這一列。')}
                {textField('contactPhone', '聯絡電話', '+886-7-550-3115')}
                {textField('contactEmail', '投稿信箱', 'name@example.com')}
              </div>
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

      <FilePickerModal
        isOpen={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(file) => pickerFor && void handlePick(pickerFor, file)}
        fileType="document"
        title={pickerFor ? `選擇投稿格式檔（${FORMATS[pickerFor].label}）` : '選擇檔案'}
      />
    </div>
  );
};
