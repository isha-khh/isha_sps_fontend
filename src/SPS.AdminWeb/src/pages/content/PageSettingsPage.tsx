import { useEffect, useState, type FormEvent } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { DownloadResourcesSection } from './DownloadResourcesSection';
import { AboutPageSection } from './AboutPageSection';
import { SupportInfoSection } from './SupportInfoSection';
import { IndustryAiLinkSection } from './IndustryAiLinkSection';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { pageSettingsApi, type ContributeFormatFile, type ContributePageSettings } from '@/lib/api/page-settings';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useNotify } from '@/hooks/useNotify';

type FormatKind = 'docx' | 'odt' | 'pdf';

/** 格式 → 設定裡存檔案 id 的欄位 */
const ID_FIELD: Record<FormatKind, 'docxFileId' | 'odtFileId' | 'pdfFileId'> = {
  docx: 'docxFileId',
  odt: 'odtFileId',
  pdf: 'pdfFileId',
};

const FORMATS: Record<FormatKind, { label: string; extension: string; hint: string }> = {
  docx: { label: 'Word 格式（.docx）', extension: '.docx', hint: 'Microsoft Word 文件，多數投稿者習慣使用。' },
  odt: { label: 'ODF 格式（.odt）', extension: '.odt', hint: 'OpenDocument 文字文件，LibreOffice、WPS 等都能開啟。' },
  pdf: { label: 'PDF 格式（.pdf）', extension: '.pdf', hint: '前台可先閱讀填寫說明。' },
};

const EMPTY: ContributePageSettings = {
  odtFileId: null,
  pdfFileId: null,
  docxFileId: null,
  imageFileId: null,
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
 * 投稿格式檔（Word、ODF、PDF 各一個）與投稿聯絡資訊；之後其他頁面的設定也放在這一頁。
 *
 * 投稿格式檔從檔案管理系統挑（對話框可以直接上傳新檔案），前台「下載投稿格式」按鈕會開一個對話框，
 * 列出這裡設定好的格式讓使用者下載。沒有設定的格式不會出現；兩個都沒設定時前台顯示「投稿格式準備中」。
 * 副檔名必須對得上（Word＝.docx、ODF＝.odt、PDF＝.pdf），後端也會再檢查一次。
 *
 * 「關於我們」與「補助專區資訊區塊」是兩個獨立的區塊（各有儲存按鈕），維護這兩頁的文字內容，見 `AboutPageSection.tsx`／`SupportInfoSection.tsx`。
 *
 * 頁面最下方的「下載資源」區塊維護前台其他地方的下載按鈕（會員申請須知與附件、補助專區、XR 訓練模組），可設檔案或外部連結，
 * 見 `DownloadResourcesSection.tsx`；它有自己的儲存按鈕。
 *
 * 前台有 1 分鐘的快取，儲存後最多 1 分鐘才看得到。需要「網站內容管理」權限。
 */
/**
 * `view` 決定這一頁顯示哪些區塊（同一個元件掛在三個後台選單項目）：
 * - `misc`（預設，「頁面設定」）：「產業AI」外部連結、補助專區資訊區塊、下載資源
 * - `contribute`（「我要投稿」）：投稿頁的主視覺圖片、投稿格式檔、聯絡資訊
 * - `about`（「關於我們」）：關於我們頁的文字內容
 */
export const PageSettingsPage = ({ view = 'misc' }: { view?: 'misc' | 'contribute' | 'about' }) => {
  const notify = useNotify();
  const [form, setForm] = useState<ContributePageSettings>(EMPTY);
  // 目前選到的檔案資訊（檔名、大小）；剛從對話框選的檔案還沒儲存前，先用選到的檔名顯示
  const [files, setFiles] = useState<Record<FormatKind, { name: string; size?: string } | null>>({ docx: null, odt: null, pdf: null });
  const [pickerFor, setPickerFor] = useState<FormatKind | null>(null);
  // 主視覺圖片：`imageUrl` 是目前顯示的預覽（原本的圖或剛挑的圖）
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(view === 'contribute');
  const [isSaving, setIsSaving] = useState(false);

  const describe = (f: ContributeFormatFile | null) => (f ? { name: f.fileName, size: f.formattedFileSize } : null);

  useEffect(() => {
    // 只有「我要投稿」這一頁需要載入投稿設定
    if (view !== 'contribute') return;
    let cancelled = false;
    pageSettingsApi
      .getContribute()
      .then((data) => {
        if (cancelled) return;
        setForm({ ...EMPTY, ...data.settings });
        setFiles({ docx: describe(data.docx), odt: describe(data.odt), pdf: describe(data.pdf) });
        setImageName(data.image?.fileName ?? null);
        setImageUrl(data.image?.url ?? null);
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
    setForm((prev) => ({ ...prev, [ID_FIELD[kind]]: id }));
    setFiles((prev) => ({ ...prev, [kind]: { name, size: 'formattedFileSize' in file ? file.formattedFileSize : undefined } }));
    setPickerFor(null);
  };

  const handleImagePick = (file: FileListItem | FileUploadResponse) => {
    const { id, name } = pickedFile(file);
    setForm((prev) => ({ ...prev, imageFileId: id }));
    setImageName(name);
    setImageUrl(`/api/FileManagement/${id}/download`);
    setIsImagePickerOpen(false);
  };

  const handleImageClear = () => {
    setForm((prev) => ({ ...prev, imageFileId: null }));
    setImageName(null);
    setImageUrl(null);
  };

  const handleClear = (kind: FormatKind) => {
    setForm((prev) => ({ ...prev, [ID_FIELD[kind]]: null }));
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
      {notify.NotifyComponent}
      <PageTitle
        title={view === 'contribute' ? '我要投稿' : view === 'about' ? '關於我們' : '頁面設定'}
        items={
          view === 'contribute'
            ? [{ label: '推廣專區', path: '/content/contribute' }, { label: '我要投稿', active: true }]
            : view === 'about'
              ? [{ label: '關於我們', active: true }]
              : [{ label: '內容管理', path: '/content/page-settings' }, { label: '頁面設定', active: true }]
        }
      />

      {view === 'contribute' && isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : view === 'contribute' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-4">
              <h3 className="card-title text-lg">我要投稿（前台 /promotion/contribute）</h3>
              <p className="text-sm text-base-content/70">
                前台「下載投稿格式」按鈕會開啟對話框，讓使用者選擇下載 Word、ODF 或 PDF 格式。只有設定好的格式會出現；三個都沒設定時，前台顯示「投稿格式準備中」。這三個檔案也可以隨程式碼 seed（放在 API 專案的 wwwroot/seed/contribute/），後台這裡的更換與移除不會被重啟蓋掉。
              </p>

              <h4 className="font-semibold">主視覺圖片</h4>
              <p className="text-sm text-base-content/70">顯示在前台「我要投稿」頁標題下方；沒有設定就使用預設圖片。建議 4:3 的橫式圖片。</p>
              {imageUrl ? (
                <img src={imageUrl} alt="主視覺圖片預覽" className="w-full max-w-md rounded-box border border-base-300 object-cover max-h-64" />
              ) : (
                <div className="flex h-32 max-w-md items-center justify-center rounded-box border border-dashed border-base-300 text-sm text-base-content/50">
                  使用預設圖片
                </div>
              )}
              {imageName && <p className="text-xs text-base-content/60 break-all">{imageName}</p>}
              <div className="flex gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsImagePickerOpen(true)}>
                  <span className="iconify lucide--folder-open size-4" />
                  {imageUrl ? '更換圖片' : '選擇圖片'}
                </button>
                {imageUrl && (
                  <button type="button" className="btn btn-sm btn-ghost text-error" onClick={handleImageClear}>
                    <span className="iconify lucide--x size-4" />
                    移除（改用預設圖片）
                  </button>
                )}
              </div>

              <div className="divider my-1" />

              <h4 className="font-semibold">投稿格式</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderFormat('docx')}
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
      ) : null}

      {view === 'misc' && <IndustryAiLinkSection />}

      {view === 'about' && <AboutPageSection />}

      {view === 'misc' && <SupportInfoSection />}

      {view === 'misc' && <DownloadResourcesSection />}

      <FilePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(file) => handleImagePick(file)}
        fileType="image"
        title="選擇「我要投稿」主視覺圖片"
      />
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
