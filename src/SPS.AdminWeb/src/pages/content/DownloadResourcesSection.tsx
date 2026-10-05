import { useEffect, useMemo, useState } from 'react';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import {
  pageSettingsApi,
  type DownloadResourceFile,
  type DownloadResourceItem,
  type DownloadResourceUpdate,
} from '@/lib/api/page-settings';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useNotify } from '@/hooks/useNotify';

type Kind = 'docx' | 'odt' | 'pdf';

const KIND_LABEL: Record<Kind, string> = { docx: 'Word（.docx）', odt: 'ODF（.odt）', pdf: 'PDF（.pdf）' };
const ID_FIELD = { docx: 'docxFileId', odt: 'odtFileId', pdf: 'pdfFileId' } as const;

/** 編輯中的一個項目：檔案 id + 顯示用檔名 + 外部連結 */
interface Draft {
  docxFileId: string | null;
  odtFileId: string | null;
  pdfFileId: string | null;
  names: Record<Kind, string | null>;
  externalUrl: string;
}

const toDraft = (item: DownloadResourceItem): Draft => {
  const name = (f: DownloadResourceFile | null) => (f ? `${f.fileName}（${f.formattedFileSize}）` : null);
  return {
    docxFileId: item.docxFileId,
    odtFileId: item.odtFileId,
    pdfFileId: item.pdfFileId,
    names: { docx: name(item.docx), odt: name(item.odt), pdf: name(item.pdf) },
    externalUrl: item.externalUrl,
  };
};

const pickedFile = (file: FileListItem | FileUploadResponse) =>
  'fileId' in file ? { id: file.fileId, name: file.fileName } : { id: file.id, name: file.originalFileName };

/**
 * 「下載資源」：前台各處「下載」按鈕背後的固定項目（會員申請須知與附件、補助專區五個快速連結、XR 訓練模組…）。
 * 每個項目可以設定 Word／ODF／PDF 檔案（只列該項目允許的格式），或改填一個外部連結——
 * 外部連結有填時優先於檔案，前台會直接開新分頁；有多個格式時前台會跳出對話框讓使用者選。
 * 項目本身（有哪些、各允許哪些格式）由後端程式碼定義，要新增項目需要改程式。
 * 這裡有自己的儲存按鈕，只送有變動的項目。
 */
export const DownloadResourcesSection = () => {
  const notify = useNotify();
  const [items, setItems] = useState<DownloadResourceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saved, setSaved] = useState<Record<string, Draft>>({});
  const [picker, setPicker] = useState<{ key: string; kind: Kind } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const list = await pageSettingsApi.getDownloads();
    const map = Object.fromEntries(list.map((i) => [i.key, toDraft(i)]));
    setItems(list);
    setDrafts(map);
    setSaved(map);
  };

  useEffect(() => {
    load()
      .catch(async () => notify.error('載入下載資源失敗'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = (key: string) => {
    const a = drafts[key];
    const b = saved[key];
    return !!a && !!b && (a.docxFileId !== b.docxFileId || a.odtFileId !== b.odtFileId || a.pdfFileId !== b.pdfFileId || a.externalUrl.trim() !== b.externalUrl.trim());
  };
  const dirtyKeys = items.map((i) => i.key).filter(isDirty);

  const groups = useMemo(() => {
    const map = new Map<string, DownloadResourceItem[]>();
    items.forEach((i) => map.set(i.group, [...(map.get(i.group) ?? []), i]));
    return [...map.entries()];
  }, [items]);

  const patch = (key: string, change: Partial<Draft>) => setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...change } }));

  const handlePick = async (file: FileListItem | FileUploadResponse) => {
    if (!picker) return;
    const { key, kind } = picker;
    const { id, name } = pickedFile(file);
    if (!name.toLowerCase().endsWith(`.${kind}`)) {
      await notify.warning(`「${KIND_LABEL[kind]}」必須選擇副檔名為 .${kind} 的檔案`);
      return;
    }
    patch(key, { [ID_FIELD[kind]]: id, names: { ...drafts[key].names, [kind]: name } });
    setPicker(null);
  };

  const clearKind = (key: string, kind: Kind) =>
    patch(key, { [ID_FIELD[kind]]: null, names: { ...drafts[key].names, [kind]: null } });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: DownloadResourceUpdate[] = dirtyKeys.map((key) => ({
        key,
        docxFileId: drafts[key].docxFileId,
        odtFileId: drafts[key].odtFileId,
        pdfFileId: drafts[key].pdfFileId,
        externalUrl: drafts[key].externalUrl.trim(),
      }));
      await pageSettingsApi.updateDownloads(updates);
      await load();
      await notify.success('已儲存，前台最多 1 分鐘後更新');
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body space-y-4">
        <h3 className="card-title text-lg">下載資源（前台各處的下載按鈕）</h3>
        <p className="text-sm text-base-content/70">
          每個項目可以選擇 Word／ODF／PDF 檔案，或填一個外部連結。<b>有填外部連結時優先使用連結</b>（前台開新分頁）；
          沒有連結時，前台依設定好的檔案顯示：只有一個格式直接下載，多個格式會跳出對話框讓使用者選擇；都沒設定則顯示「準備中」。
          檔案也可以隨程式碼 seed（API 專案 wwwroot/seed/），後台這裡的更換與移除不會被重啟蓋掉。
        </p>

        {groups.map(([group, list]) => (
          <div className="space-y-3" key={group}>
            <div className="divider my-1 text-sm font-semibold">{group}</div>
            {list.map((item) => {
              const draft = drafts[item.key];
              if (!draft) return null;
              const hasLink = draft.externalUrl.trim() !== '';
              return (
                <div className="rounded-box border border-base-300 p-4 space-y-3" key={item.key}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">
                        {item.title}
                        {isDirty(item.key) && <span className="badge badge-warning badge-sm ml-2">未儲存</span>}
                      </h4>
                      <p className="text-xs text-base-content/60">使用位置：{item.usedAt}</p>
                    </div>
                    <span className={`badge ${hasLink ? 'badge-info' : item.formats.some((k) => draft[ID_FIELD[k]]) ? 'badge-success' : 'badge-ghost'}`}>
                      {hasLink ? '使用外部連結' : item.formats.some((k) => draft[ID_FIELD[k]]) ? '使用檔案' : '尚未設定'}
                    </span>
                  </div>

                  {item.formats.length > 0 && (
                    <div className={`grid grid-cols-1 gap-3 ${item.formats.length > 1 ? 'md:grid-cols-3' : ''}`}>
                      {item.formats.map((kind) => {
                        const name = draft.names[kind];
                        return (
                          <div className="space-y-1" key={kind}>
                            <div className="text-sm font-medium">{KIND_LABEL[kind]}</div>
                            <div className="text-sm break-all min-h-5">
                              {name ?? <span className="text-base-content/60">未設定</span>}
                            </div>
                            <div className="flex gap-2">
                              <button type="button" className="btn btn-xs btn-primary" onClick={() => setPicker({ key: item.key, kind })}>
                                {name ? '更換' : '選擇檔案'}
                              </button>
                              {name && (
                                <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => clearKind(item.key, kind)}>
                                  移除
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label py-1" htmlFor={`dl-url-${item.key}`}>
                      <span className="label-text font-medium">外部連結{item.formats.length === 0 ? '' : '（選填，填了就優先使用）'}</span>
                    </label>
                    <input
                      id={`dl-url-${item.key}`}
                      type="url"
                      className="input input-bordered input-sm w-full"
                      placeholder="https://example.com/download"
                      maxLength={500}
                      value={draft.externalUrl}
                      onChange={(e) => patch(item.key, { externalUrl: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" disabled={isSaving || dirtyKeys.length === 0} onClick={() => void handleSave()}>
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <span className="iconify lucide--save size-4" />
                儲存下載資源{dirtyKeys.length > 0 ? `（${dirtyKeys.length} 項）` : ''}
              </>
            )}
          </button>
        </div>
      </div>

      <FilePickerModal
        isOpen={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(file) => void handlePick(file)}
        fileType="document"
        title={picker ? `選擇檔案（${KIND_LABEL[picker.kind]}）` : '選擇檔案'}
      />
    </div>
  );
};
