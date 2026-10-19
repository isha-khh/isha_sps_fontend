import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inquiriesApi } from '@/lib/api/inquiries';
import { InquiryStatusLabels } from '@/types/inquiry';
import type { Inquiry } from '@/types/inquiry';
import { useNotify } from '@/hooks/useNotify';

const STATUS_BADGE: Record<number, string> = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-ghost' };
const MAX_ROWS = 100;

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-TW', { hour12: false });

/**
 * 某個項目（補助資源、技術工具）收到的前台表單回應：「索取資料協助評估」「立即下載」送出後存成詢問單，
 * 這裡列出針對這個項目的那些詢問單，並可匯出 Excel。需要「客服服務」權限，沒有權限會顯示說明。
 * 要改處理狀態、寫備註或回覆，到「詢問單」收件匣。
 */
export const NewsResponsesCard = ({ targetType, targetKey, noun }: { targetType: string; targetKey: string; noun: string }) => {
  const notify = useNotify();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    inquiriesApi
      .getInquiries(1, MAX_ROWS, { targetType, targetKey })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.totalCount);
        setState('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setState((error as { response?: { status?: number } })?.response?.status === 403 ? 'forbidden' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetKey]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await inquiriesApi.exportToExcel({ targetType, targetKey });
    } catch {
      await notify.error('匯出回應失敗');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      {notify.NotifyComponent}
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="card-title">
            <span className="iconify lucide--inbox size-5" />
            表單回應
            {state === 'ready' && <span className="badge badge-primary badge-sm">{total}</span>}
          </h3>
          <div className="flex gap-2">
            <Link to="/inquiries" className="btn btn-sm btn-ghost">
              前往詢問單收件匣
            </Link>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => void handleExport()} disabled={state !== 'ready' || total === 0 || isExporting}>
              {isExporting ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--download size-4" />}
              匯出回應（Excel）
            </button>
          </div>
        </div>
        <p className="text-sm text-base-content/60">前台使用者針對這個{noun}送出的表單（姓名、聯絡方式等個人資料，請妥善保管）。</p>

        {state === 'loading' && (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner" />
          </div>
        )}
        {state === 'forbidden' && <p className="text-sm text-base-content/60 py-2">需要「客服服務」權限才能查看表單回應。</p>}
        {state === 'error' && <p className="text-sm text-error py-2">載入表單回應失敗，請稍後再試。</p>}
        {state === 'ready' && total === 0 && <p className="text-sm text-base-content/60 py-2">還沒有人送出表單。</p>}
        {state === 'ready' && total > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>送出時間</th>
                    <th>工廠／公司</th>
                    <th>姓名</th>
                    <th>電話</th>
                    <th>信箱</th>
                    <th>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap">{formatTime(item.createdTime)}</td>
                      <td>{item.companyName || <span className="text-base-content/40">-</span>}</td>
                      <td>{item.name || <span className="text-base-content/40">-</span>}</td>
                      <td className="whitespace-nowrap">{item.phone || <span className="text-base-content/40">-</span>}</td>
                      <td>{item.email || <span className="text-base-content/40">-</span>}</td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE[item.status] ?? 'badge-ghost'}`}>{InquiryStatusLabels[item.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > items.length && <p className="text-xs text-base-content/60">只顯示最新 {items.length} 筆，完整內容請匯出 Excel。</p>}
          </>
        )}
      </div>
    </div>
  );
};
