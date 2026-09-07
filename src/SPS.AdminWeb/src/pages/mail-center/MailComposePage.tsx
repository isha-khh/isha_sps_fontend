import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { companiesApi } from '@/lib/api/companies';
import { mailCampaignsApi } from '@/lib/api/mailCampaigns';
import { filesManagementApi } from '@/lib/api/files-management';
import type { Company } from '@/types/company';
import { Status, CompanyType, CompanyLevel } from '@/types/company';
import { useNotify } from '@/hooks/useNotify';
import { useConfirm } from '@/hooks/useConfirm';
import type {
  CampaignRecipientFilter,
  EnqueueCampaignResponse,
  RecipientPreviewItem,
} from '@/types/mailCampaign';
import { EmailSendMode } from '@/types/mailCampaign';
import { RecipientPickerDialog } from '@/components/mail-center/RecipientPickerDialog';
import { useCampaignProgressStore } from '@/stores/campaign-progress-store';

interface AttachmentItem {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const SUPPORTED_VARS: Array<{
  key: string;
  label: string;
  source: string;
  example: string;
  fallback: string;
}> = [
  {
    key: 'Name',
    label: '會員稱呼',
    source: '會員資料的暱稱（Member.Nickname）',
    example: '王小明',
    fallback: '若會員未設定暱稱，自動填「會員」',
  },
  {
    key: 'Email',
    label: 'Email',
    source: '會員的 Email（同收件信箱）',
    example: 'sample@example.com',
    fallback: '一律存在；會員必填欄位',
  },
  {
    key: 'CompanyName',
    label: '公司名稱',
    source: '會員所屬公司的名稱（Company.Name）',
    example: 'ACME 股份有限公司',
    fallback: '會員無公司時自動填「貴公司」',
  },
  {
    key: 'CompanyNumber',
    label: '公司編號',
    source: '所屬公司的編號（Company.Number）',
    example: 'C-0001',
    fallback: '會員無公司時填空字串',
  },
  {
    key: 'Position',
    label: '職稱',
    source: '會員職稱 Position；若無則用 MemberJobTitle',
    example: '採購經理',
    fallback: '兩者皆無時填空字串',
  },
  {
    key: 'MemberNumber',
    label: '會員編號',
    source: '會員的編號（Member.Number）',
    example: 'M-2026-0042',
    fallback: '一律存在；會員必填欄位',
  },
];

const COMPANY_TYPE_LABEL: Record<number, string> = {
  [CompanyType.Supplier]: '供應商',
  [CompanyType.Buyer]: '需求方',
  [CompanyType.Both]: '雙向',
};
const COMPANY_LEVEL_LABEL: Record<number, string> = {
  [CompanyLevel.Regular]: '一般',
  [CompanyLevel.Silver]: '銀',
  [CompanyLevel.Gold]: '金',
  [CompanyLevel.Diamond]: '鑽石',
};

type VariableTarget = 'subject' | 'body';

function VariableChips({
  target,
  onInsert,
}: {
  target: VariableTarget;
  onInsert: (key: string, target: VariableTarget) => void;
}) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-base-content/60">
          {target === 'subject' ? '插入變數至主旨：' : '插入變數至內容：'}
        </span>
        {SUPPORTED_VARS.map((v) => (
          <div key={v.key} className="tooltip tooltip-top" data-tip={`${v.source}；${v.fallback}`}>
            <button
              type="button"
              className="badge badge-ghost cursor-pointer hover:badge-primary gap-1"
              onClick={() => onInsert(v.key, target)}
            >
              <span className="font-mono">{`{{${v.key}}}`}</span>
              <span className="text-[10px] opacity-70">{v.label}</span>
            </button>
          </div>
        ))}
      </div>
      {target === 'subject' && (
        <details className="text-xs">
          <summary className="cursor-pointer text-base-content/60 hover:text-base-content/80 inline-flex items-center gap-1">
            <span className="iconify lucide--help-circle size-3.5" />
            變數說明
          </summary>
          <div className="mt-1.5 border rounded p-2 bg-base-200/50 overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>變數</th>
                  <th>來源</th>
                  <th>範例</th>
                  <th>無資料時</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_VARS.map((v) => (
                  <tr key={v.key}>
                    <td className="font-mono whitespace-nowrap">{`{{${v.key}}}`}</td>
                    <td>{v.source}</td>
                    <td className="text-base-content/70">{v.example}</td>
                    <td className="text-base-content/70">{v.fallback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export const MailComposePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const trackCampaign = useCampaignProgressStore((s) => s.track);

  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const [sendMode, setSendMode] = useState<EmailSendMode>(EmailSendMode.Bcc);

  // Filter（由 Picker Dialog 維護）
  const [filterCompanyTypes, setFilterCompanyTypes] = useState<number[]>([]);
  const [filterCompanyLevels, setFilterCompanyLevels] = useState<number[]>([]);
  const [filterMemberStatus, setFilterMemberStatus] = useState<number>(Status.Active);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [previewItems, setPreviewItems] = useState<RecipientPreviewItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduleAt, setScheduleAt] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<EnqueueCampaignResponse | null>(null);

  // 套用系統版型 + 附件
  const [applyLayout, setApplyLayout] = useState(true);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 信件預覽
  const [isBodyPreviewOpen, setIsBodyPreviewOpen] = useState(false);
  const [isLoadingBodyPreview, setIsLoadingBodyPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // 測試寄送
  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, string>>(() =>
    SUPPORTED_VARS.reduce<Record<string, string>>((acc, v) => {
      acc[v.key] = v.example;
      return acc;
    }, {})
  );

  const companyIds = useMemo(
    () => selectedCompanies.map((c) => c.id),
    [selectedCompanies]
  );

  const currentFilter: CampaignRecipientFilter | undefined = useMemo(() => {
    const f: CampaignRecipientFilter = {};
    if (filterCompanyTypes.length > 0) f.companyTypes = filterCompanyTypes;
    if (filterCompanyLevels.length > 0) f.companyLevels = filterCompanyLevels;
    if (filterMemberStatus !== Status.Active) f.memberStatus = filterMemberStatus;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [filterCompanyTypes, filterCompanyLevels, filterMemberStatus]);

  // URL ?companyIds=
  useEffect(() => {
    const idsParam = searchParams.get('companyIds');
    if (!idsParam) return;
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    (async () => {
      const companies = await Promise.all(
        ids.map((id) => companiesApi.getCompanyById(id).catch(() => null))
      );
      setSelectedCompanies(companies.filter((c): c is Company => c !== null));
    })();
  }, [searchParams]);

  // 收件人數預覽
  useEffect(() => {
    if (!broadcastMode && companyIds.length === 0) {
      setRecipientCount(null);
      return;
    }
    const t = setTimeout(async () => {
      setIsPreviewing(true);
      try {
        const { count } = await mailCampaignsApi.previewRecipientCount({
          companyIds: broadcastMode ? [] : companyIds,
          filter: currentFilter,
          broadcast: broadcastMode,
        });
        setRecipientCount(count);
      } catch {
        setRecipientCount(null);
      } finally {
        setIsPreviewing(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [broadcastMode, companyIds, currentFilter]);

  const handlePickerConfirm = (
    mode: 'companies' | 'broadcast',
    companies: Company[],
    filter: CampaignRecipientFilter | undefined,
  ) => {
    setBroadcastMode(mode === 'broadcast');
    setSelectedCompanies(companies);
    setFilterCompanyTypes(filter?.companyTypes ?? []);
    setFilterCompanyLevels(filter?.companyLevels ?? []);
    setFilterMemberStatus(filter?.memberStatus ?? Status.Active);
    setIsPickerOpen(false);
  };

  const insertVariable = (key: string, target: 'subject' | 'body') => {
    const token = `{{${key}}}`;
    if (target === 'subject') {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? subject.length;
      const next = subject.slice(0, start) + token + subject.slice(end);
      setSubject(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      const el = bodyRef.current;
      if (!el) return;
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const next = body.slice(0, start) + token + body.slice(end);
      setBody(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    }
  };

  const handleViewPreview = async () => {
    setIsPreviewOpen(true);
    setIsLoadingPreview(true);
    try {
      const res = await mailCampaignsApi.previewRecipientList({
        companyIds: broadcastMode ? [] : companyIds,
        filter: currentFilter,
        broadcast: broadcastMode,
        limit: 50,
      });
      setPreviewItems(res.items);
    } catch (err) {
      console.error('Preview list failed:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded: AttachmentItem[] = [];
      for (const file of Array.from(files)) {
        try {
          const res = await filesManagementApi.uploadFile({ file, isPublic: false });
          uploaded.push({
            fileId: res.fileId,
            fileName: res.fileName || file.name,
            fileSize: res.fileSize ?? file.size,
            contentType: res.contentType || file.type,
          });
        } catch (err) {
          console.error('Upload failed:', err);
          await notify.error(`「${file.name}」上傳失敗`);
        }
      }
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  };

  const handleOpenBodyPreview = async () => {
    if (!body.trim()) {
      await notify.warning('內容為空，無法預覽');
      return;
    }
    setIsBodyPreviewOpen(true);
    setIsLoadingBodyPreview(true);
    setPreviewHtml('');
    try {
      const res = await mailCampaignsApi.previewBody({
        subject: subject || '（無主旨）',
        body,
        applyLayout,
      });
      setPreviewHtml(res.html);
    } catch (err) {
      console.error('Preview body failed:', err);
      await notify.error('預覽失敗，請稍後再試');
      setIsBodyPreviewOpen(false);
    } finally {
      setIsLoadingBodyPreview(false);
    }
  };

  const handleTestSend = async () => {
    if (!subject.trim()) return notify.warning('請先輸入主旨');
    if (!body.trim()) return notify.warning('請先輸入內容');
    if (!testEmail.trim()) return notify.warning('請輸入測試收件 Email');
    // 簡單 email 格式檢查
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      return notify.warning('Email 格式不正確');
    }
    setIsTestSending(true);
    try {
      await mailCampaignsApi.testSend({
        subject: subject.trim(),
        body,
        testEmail: testEmail.trim(),
        applyLayout,
        variables: testVariables,
        attachmentFileIds: attachments.map((a) => a.fileId),
      });
      notify.success(`已寄出測試信到 ${testEmail.trim()}`);
      setIsTestSendOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '測試寄送失敗';
      notify.error(msg);
    } finally {
      setIsTestSending(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) return notify.warning('請輸入主旨');
    if (!body.trim()) return notify.warning('請輸入內容');
    if (!broadcastMode && companyIds.length === 0) return notify.warning('請至少選擇一家公司，或改用廣播模式');
    if (recipientCount === 0) return notify.warning('篩選後沒有收件人');

    let scheduleIso: string | null = null;
    if (scheduleMode === 'later') {
      if (!scheduleAt) return notify.warning('請選擇排程時間');
      const d = new Date(scheduleAt);
      if (Number.isNaN(d.getTime())) return notify.warning('排程時間格式不正確');
      if (d.getTime() <= Date.now()) return notify.warning('排程時間需在未來');
      scheduleIso = d.toISOString();
    }

    const modeLabel = sendMode === EmailSendMode.PerRecipient ? '每人一封（含變數替換）' : '同一封 BCC';
    const whenLabel = scheduleIso
      ? `排程於 ${new Date(scheduleIso).toLocaleString('zh-TW')}`
      : '立即';
    const scopeLabel = broadcastMode
      ? `⚠️ 廣播給「${currentFilter ? '符合篩選條件的全部會員' : '全部 Active 會員'}」`
      : `寄給 ${selectedCompanies.length} 家公司會員`;
    const ok = await confirmDialog({
      cardTitle: broadcastMode ? '⚠️ 確認廣播寄送' : '確認寄送',
      message: `${scopeLabel}\n模式：${modeLabel}\n時機：${whenLabel}\n收件人數：${recipientCount ?? '?'}\n\n是否繼續？`,
      buttonConfirm: scheduleIso ? '排入佇列' : '立即排入',
      buttonCancel: '取消',
    });
    if (!ok) return;

    setIsSending(true);
    setResult(null);
    try {
      const res = await mailCampaignsApi.send({
        subject: subject.trim(),
        body,
        companyIds: broadcastMode ? [] : companyIds,
        sendMode,
        filter: currentFilter,
        scheduleAt: scheduleIso,
        broadcast: broadcastMode,
        applyLayout,
        attachmentFileIds: attachments.map((a) => a.fileId),
      });
      setResult(res);
      trackCampaign(res.campaignId, subject.trim(), res.totalRecipients);
      notify.success(
        scheduleIso
          ? `已排程 ${res.totalRecipients} 位收件人，排定 ${new Date(res.scheduledFor).toLocaleString('zh-TW')} 寄出`
          : `已排入佇列：${res.totalRecipients} 位收件人，進度將顯示在右下角通知`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '寄送失敗';
      notify.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="發送郵件"
        items={[
          { label: '郵件中心' },
          { label: '發送郵件', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-6">
          {/* 收件對象（摘要） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                <span className="iconify lucide--users size-4 inline-block mr-1" />
                收件對象
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-primary btn-sm"
                onClick={() => setIsPickerOpen(true)}
              >
                <span className="iconify lucide--edit-3 size-4" />
                {selectedCompanies.length === 0 ? '選擇收件對象' : '編輯'}
              </button>
            </div>

            <div className={`border rounded-lg p-3 ${broadcastMode ? 'bg-warning/10 border-warning/30' : 'bg-base-200/50'}`}>
              {!broadcastMode && selectedCompanies.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  尚未選擇收件對象，點右上「選擇收件對象」開啟挑選器。
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {broadcastMode ? (
                    <div>
                      <span className="badge badge-warning badge-sm gap-1">
                        <span className="iconify lucide--megaphone size-3" />
                        廣播模式
                      </span>
                      <span className="ml-2 text-base-content/70">
                        不限定公司，{currentFilter ? '依下方篩選條件' : '全部 Active'} 會員
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium">公司</span>
                      <span className="text-base-content/60 ml-1">（{selectedCompanies.length}）</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCompanies.slice(0, 8).map((c) => (
                          <span key={c.id} className="badge badge-ghost badge-sm">
                            {c.name}
                          </span>
                        ))}
                        {selectedCompanies.length > 8 && (
                          <span className="badge badge-ghost badge-sm">
                            +{selectedCompanies.length - 8} 家
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {currentFilter && (
                    <div>
                      <span className="font-medium">進階篩選</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {currentFilter.companyTypes?.map((v) => (
                          <span key={`t-${v}`} className="badge badge-info badge-sm">
                            類型：{COMPANY_TYPE_LABEL[v] ?? v}
                          </span>
                        ))}
                        {currentFilter.companyLevels?.map((v) => (
                          <span key={`l-${v}`} className="badge badge-info badge-sm">
                            級別：{COMPANY_LEVEL_LABEL[v] ?? v}
                          </span>
                        ))}
                        {currentFilter.memberStatus !== undefined && currentFilter.memberStatus !== Status.Active && (
                          <span className="badge badge-info badge-sm">會員狀態：停用</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1 border-t">
                    <div className="text-base-content/70">
                      {isPreviewing ? (
                        <span>計算中...</span>
                      ) : recipientCount !== null ? (
                        <span>
                          將寄給 <span className="font-semibold">{recipientCount}</span> 位收件人
                        </span>
                      ) : null}
                    </div>
                    {recipientCount !== null && recipientCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={handleViewPreview}
                      >
                        <span className="iconify lucide--list size-3.5" />
                        預覽清單
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 寄送模式 */}
          <section>
            <h3 className="font-semibold mb-2">
              <span className="iconify lucide--send size-4 inline-block mr-1" />
              寄送模式
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm mt-0.5"
                  checked={sendMode === EmailSendMode.Bcc}
                  onChange={() => setSendMode(EmailSendMode.Bcc)}
                />
                <div>
                  <div className="font-medium text-sm">同一封 BCC（最快）</div>
                  <div className="text-xs text-base-content/60">內容一致，每 50 人一批 BCC 寄出，不支援變數。</div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm mt-0.5"
                  checked={sendMode === EmailSendMode.PerRecipient}
                  onChange={() => setSendMode(EmailSendMode.PerRecipient)}
                />
                <div>
                  <div className="font-medium text-sm">每人一封（含變數替換，單次上限 500 人）</div>
                  <div className="text-xs text-base-content/60">
                    可在主旨/內容用 {'{{Name}}'} 等變數，每位收件人收到專屬版本；寄送時間較長。
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* 排程 */}
          <section>
            <h3 className="font-semibold mb-2">
              <span className="iconify lucide--clock size-4 inline-block mr-1" />
              寄送時機
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm"
                  checked={scheduleMode === 'now'}
                  onChange={() => setScheduleMode('now')}
                />
                <span className="text-sm">立即（背景 worker 30 秒內取出處理）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm"
                  checked={scheduleMode === 'later'}
                  onChange={() => setScheduleMode('later')}
                />
                <span className="text-sm">排程於</span>
                <input
                  type="datetime-local"
                  className="input input-bordered input-sm"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  disabled={scheduleMode !== 'later'}
                />
              </label>
            </div>
          </section>

          {/* 主旨 */}
          <section>
            <label className="block">
              <span className="font-semibold">主旨</span>
              <input
                ref={subjectRef}
                type="text"
                className="input input-bordered input-sm w-full mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例：{{CompanyName}} 年度會員大會通知"
                maxLength={200}
              />
            </label>
            {sendMode === EmailSendMode.PerRecipient && (
              <VariableChips target="subject" onInsert={insertVariable} />
            )}
          </section>

          {/* 內容 */}
          <section>
            <label className="block">
              <span className="font-semibold">內容</span>
              <span className="text-xs text-base-content/60 ml-2">支援 HTML</span>
              <textarea
                ref={bodyRef}
                className="textarea textarea-bordered w-full mt-1 font-mono text-sm"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="輸入郵件內容..."
              />
            </label>
            {sendMode === EmailSendMode.PerRecipient && (
              <VariableChips target="body" onInsert={insertVariable} />
            )}
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={applyLayout}
                onChange={(e) => setApplyLayout(e.target.checked)}
              />
              <span className="text-sm">套用系統郵件版型（包含 Logo / 頁尾／品牌外框）</span>
              <span
                className="iconify lucide--info size-3.5 text-base-content/60 tooltip"
                data-tip="關閉後僅寄出你輸入的 HTML 原樣；建議保持開啟以維持與其他系統信一致的外觀"
              />
            </label>
          </section>

          {/* 附件 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                <span className="iconify lucide--paperclip size-4 inline-block mr-1" />
                附件
                {attachments.length > 0 && (
                  <span className="ml-2 text-xs text-base-content/60">
                    （{attachments.length} 個，共 {formatFileSize(attachments.reduce((s, a) => s + a.fileSize, 0))}）
                  </span>
                )}
              </h3>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      上傳中…
                    </>
                  ) : (
                    <>
                      <span className="iconify lucide--upload size-4" />
                      新增附件
                    </>
                  )}
                </button>
              </div>
            </div>
            {attachments.length === 0 ? (
              <p className="text-xs text-base-content/60">未選擇附件。所有收件人都會收到相同附件（不支援變數）。</p>
            ) : (
              <ul className="border rounded-lg divide-y">
                {attachments.map((a) => (
                  <li key={a.fileId} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="iconify lucide--file size-4 shrink-0 text-base-content/60" />
                      <span className="truncate">{a.fileName}</span>
                      <span className="text-xs text-base-content/50 shrink-0">{formatFileSize(a.fileSize)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleRemoveAttachment(a.fileId)}
                      title="移除附件"
                    >
                      <span className="iconify lucide--x size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 結果（已排入佇列） */}
          {result && (
            <section className="border border-info/30 rounded-lg p-4 bg-info/5">
              <div className="font-semibold mb-2">
                <span className="iconify lucide--check-circle size-5 inline-block mr-1 text-info" />
                已排入佇列
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>活動 ID：<span className="font-mono text-xs break-all">{result.campaignId}</span></div>
                <div>收件人數：<span className="font-mono">{result.totalRecipients}</span></div>
                <div className="col-span-2">
                  排定寄送：<span className="font-mono">{new Date(result.scheduledFor).toLocaleString('zh-TW')}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn btn-link btn-sm pl-0"
                  onClick={() => navigate('/mail-center/campaigns')}
                >
                  查看活動列表 →
                </button>
                <button
                  className="btn btn-link btn-sm pl-0"
                  onClick={() => navigate('/mail-center/logs')}
                >
                  查看寄信紀錄 →
                </button>
              </div>
            </section>
          )}

          {/* 操作列 */}
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/mail-center/campaigns')}
              disabled={isSending}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-outline btn-info btn-sm"
              onClick={handleOpenBodyPreview}
              disabled={isLoadingBodyPreview || !body.trim()}
              title="預覽信件（套用版型後的完整外觀）"
            >
              {isLoadingBodyPreview ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <span className="iconify lucide--eye size-4" />
              )}
              預覽信件
            </button>
            <button
              type="button"
              className="btn btn-outline btn-warning btn-sm"
              onClick={() => setIsTestSendOpen(true)}
              disabled={!subject.trim() || !body.trim()}
              title="寄出一封測試信到指定 Email"
            >
              <span className="iconify lucide--mail-question size-4" />
              測試寄送
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={isSending || (!broadcastMode && companyIds.length === 0)}
            >
              {isSending ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  送出中...
                </>
              ) : (
                <>
                  <span className="iconify lucide--send size-4" />
                  {scheduleMode === 'later' ? '排程寄送' : '立即寄送'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 預覽收件清單 Modal */}
      <dialog className={`modal ${isPreviewOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setIsPreviewOpen(false)}
          >
            <span className="iconify lucide--x size-5" />
          </button>
          <h3 className="font-bold text-lg mb-4">收件人預覽（前 50 筆）</h3>
          {isLoadingPreview ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : previewItems.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">查無收件人</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>{`{{Name}}`}</th>
                    <th>{`{{CompanyName}}`}</th>
                    <th>{`{{Position}}`}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((r) => (
                    <tr key={r.memberId}>
                      <td className="font-mono text-xs">{r.email}</td>
                      <td>{r.name || <span className="text-base-content/40">會員</span>}</td>
                      <td>{r.companyName || <span className="text-base-content/40">-</span>}</td>
                      <td>{r.position || <span className="text-base-content/40">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="modal-action">
            <button className="btn btn-sm" onClick={() => setIsPreviewOpen(false)}>
              關閉
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsPreviewOpen(false)}>close</button>
        </form>
      </dialog>

      {/* 收件對象 Picker */}
      <RecipientPickerDialog
        open={isPickerOpen}
        initialMode={broadcastMode ? 'broadcast' : 'companies'}
        initialCompanies={selectedCompanies}
        initialFilter={currentFilter}
        onConfirm={handlePickerConfirm}
        onClose={() => setIsPickerOpen(false)}
      />

      {/* 測試寄送 Modal */}
      <dialog className={`modal ${isTestSendOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setIsTestSendOpen(false)}
            disabled={isTestSending}
          >
            <span className="iconify lucide--x size-5" />
          </button>
          <h3 className="font-bold text-lg mb-1">測試寄送</h3>
          <p className="text-xs text-base-content/60 mb-4">
            主旨會自動加上 <span className="font-mono">[測試]</span> 前綴；
            {applyLayout ? '套用系統版型' : '不套用版型（HTML 原樣）'}；
            附件 {attachments.length} 個會一起寄出。
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">測試收件 Email</span>
              <input
                type="email"
                className="input input-bordered input-sm w-full mt-1"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
              />
            </label>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">變數預覽值</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() =>
                    setTestVariables(
                      SUPPORTED_VARS.reduce<Record<string, string>>((acc, v) => {
                        acc[v.key] = v.example;
                        return acc;
                      }, {})
                    )
                  }
                >
                  <span className="iconify lucide--rotate-ccw size-3" />
                  重設為範例值
                </button>
              </div>
              <p className="text-xs text-base-content/60 mb-2">
                主旨／內容中的 <span className="font-mono">{'{{Name}}'}</span> 等變數，會被以下值替換後寄出。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORTED_VARS.map((v) => (
                  <label key={v.key} className="block">
                    <span className="text-xs text-base-content/70">
                      <span className="font-mono">{`{{${v.key}}}`}</span>
                      <span className="ml-1">{v.label}</span>
                    </span>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full mt-0.5"
                      value={testVariables[v.key] ?? ''}
                      onChange={(e) =>
                        setTestVariables((prev) => ({ ...prev, [v.key]: e.target.value }))
                      }
                      placeholder={v.example}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsTestSendOpen(false)}
              disabled={isTestSending}
            >
              取消
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={handleTestSend}
              disabled={isTestSending || !testEmail.trim()}
            >
              {isTestSending ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  寄送中...
                </>
              ) : (
                <>
                  <span className="iconify lucide--send size-4" />
                  寄出測試
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => !isTestSending && setIsTestSendOpen(false)}>close</button>
        </form>
      </dialog>

      {/* 信件內容 Modal */}
      <dialog className={`modal ${isBodyPreviewOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-4xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setIsBodyPreviewOpen(false)}
          >
            <span className="iconify lucide--x size-5" />
          </button>
          <h3 className="font-bold text-lg mb-1">信件預覽</h3>
          <p className="text-xs text-base-content/60 mb-3">
            主旨：<span className="font-medium">{subject || '（無主旨）'}</span>
            <span className="mx-2">·</span>
            {applyLayout ? '已套用系統版型' : '未套用系統版型（原樣 HTML）'}
            {sendMode === EmailSendMode.PerRecipient && (
              <>
                <span className="mx-2">·</span>
                <span className="text-warning">變數 {'{{Name}}'} 等將於寄送時替換成各會員資料</span>
              </>
            )}
          </p>
          {isLoadingBodyPreview ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <iframe
              title="信件預覽"
              srcDoc={previewHtml}
              sandbox=""
              className="w-full bg-white"
              style={{ height: '60vh', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
          )}
          <div className="modal-action">
            <button className="btn btn-sm" onClick={() => setIsBodyPreviewOpen(false)}>
              關閉
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsBodyPreviewOpen(false)}>close</button>
        </form>
      </dialog>

      {ConfirmComponent}
    </div>
  );
};
