import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mailCampaignsApi } from '@/lib/api/mailCampaigns';
import { useNotify } from '@/hooks/useNotify';
import {
  useCampaignProgressStore,
  type TrackedCampaign,
} from '@/stores/campaign-progress-store';
import { EmailCampaignStatus, EmailSendMode } from '@/types/mailCampaign';

type Tone = 'info' | 'warning' | 'success' | 'error' | 'ghost';

function summarize(c: TrackedCampaign): {
  tone: Tone;
  headline: string;
  detailText: string;
  showProgressBar: boolean;
  progressPct: number;
} {
  const d = c.detail;
  if (!d) {
    return {
      tone: 'info',
      headline: '已排入佇列',
      detailText: `${c.subject}（${c.expectedTotal} 位收件人）`,
      showProgressBar: false,
      progressPct: 0,
    };
  }

  const total = d.totalCount || c.expectedTotal || 1;
  const done = d.successCount + d.failedCount;
  const pct = Math.min(100, Math.round((done / Math.max(total, 1)) * 100));

  switch (d.status) {
    case EmailCampaignStatus.Queued: {
      const at = d.scheduleAt ? new Date(d.scheduleAt).toLocaleString('zh-TW') : '盡快';
      return {
        tone: 'info',
        headline: '等待寄送',
        detailText: `${c.subject}\n預定：${at}`,
        showProgressBar: false,
        progressPct: 0,
      };
    }
    case EmailCampaignStatus.Sending:
      return {
        tone: 'info',
        headline: '寄送中',
        detailText: `${c.subject}\n${done} / ${total} 已處理（成功 ${d.successCount}・失敗 ${d.failedCount}）`,
        showProgressBar: true,
        progressPct: pct,
      };
    case EmailCampaignStatus.Completed: {
      if (d.failedCount === 0)
        return {
          tone: 'success',
          headline: '寄送完成',
          detailText: `${c.subject}\n全部 ${d.successCount} 位寄送成功`,
          showProgressBar: false,
          progressPct: 100,
        };
      if (d.successCount === 0)
        return {
          tone: 'error',
          headline: '全部失敗',
          detailText: `${c.subject}\n${d.failedCount} 位寄送失敗，請至寄信紀錄查看原因`,
          showProgressBar: false,
          progressPct: 100,
        };
      return {
        tone: 'warning',
        headline: '部份失敗',
        detailText: `${c.subject}\n成功 ${d.successCount}・失敗 ${d.failedCount}（共 ${total} 位）`,
        showProgressBar: false,
        progressPct: 100,
      };
    }
    case EmailCampaignStatus.Failed:
      return {
        tone: 'error',
        headline: '全部失敗',
        detailText: `${c.subject}\n${d.errorMessage || '處理過程發生錯誤，請至寄信紀錄查看原因'}`,
        showProgressBar: false,
        progressPct: 100,
      };
    case EmailCampaignStatus.Cancelled:
      return {
        tone: 'ghost',
        headline: '已取消',
        detailText: c.subject,
        showProgressBar: false,
        progressPct: 0,
      };
    default:
      return {
        tone: 'info',
        headline: `狀態 ${d.status}`,
        detailText: c.subject,
        showProgressBar: false,
        progressPct: 0,
      };
  }
}

const TONE_CLASSES: Record<Tone, { border: string; bg: string; icon: string; iconColor: string }> = {
  info:    { border: 'border-info/40',    bg: 'bg-info/5',    icon: 'lucide--mail',         iconColor: 'text-info' },
  success: { border: 'border-success/40', bg: 'bg-success/5', icon: 'lucide--check-circle', iconColor: 'text-success' },
  warning: { border: 'border-warning/40', bg: 'bg-warning/5', icon: 'lucide--alert-triangle', iconColor: 'text-warning' },
  error:   { border: 'border-error/40',   bg: 'bg-error/5',   icon: 'lucide--x-circle',     iconColor: 'text-error' },
  ghost:   { border: 'border-base-300',   bg: 'bg-base-200',  icon: 'lucide--circle',       iconColor: 'text-base-content/60' },
};

export const CampaignProgressNotifications = () => {
  const campaigns = useCampaignProgressStore((s) => s.campaigns);
  const dismiss = useCampaignProgressStore((s) => s.dismiss);
  const track = useCampaignProgressStore((s) => s.track);
  const notify = useNotify();

  const visible = useMemo(
    () =>
      Object.values(campaigns)
        .filter((c) => !c.dismissed)
        .sort((a, b) => (b.detail?.createdTime ?? '').localeCompare(a.detail?.createdTime ?? '')),
    [campaigns]
  );

  if (visible.length === 0) return null;

  const handleRetry = async (c: TrackedCampaign) => {
    try {
      const res = await mailCampaignsApi.retryFailed(c.id);
      track(res.campaignId, `${c.subject}（重試）`, res.totalRecipients);
      dismiss(c.id);
      notify.success(`已建立重試活動，包含 ${res.totalRecipients} 位失敗收件人`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '重試失敗';
      notify.error(msg);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {visible.map((c) => {
        const s = summarize(c);
        const cls = TONE_CLASSES[s.tone];
        const d = c.detail;
        const isPartial = s.headline === '部份失敗';
        const isAllFailed = s.headline === '全部失敗';
        const canRetry =
          d != null
          && d.sendMode === EmailSendMode.PerRecipient
          && d.failedCount > 0
          && (d.status === EmailCampaignStatus.Completed || d.status === EmailCampaignStatus.Failed);

        return (
          <div
            key={c.id}
            className={`rounded-lg border ${cls.border} ${cls.bg} shadow-md p-3 text-sm`}
          >
            <div className="flex items-start gap-2">
              <span className={`iconify ${cls.icon} size-5 mt-0.5 ${cls.iconColor}`} />
              <div className="grow min-w-0">
                <div className="font-semibold">{s.headline}</div>
                <div className="text-xs text-base-content/70 whitespace-pre-line line-clamp-3">
                  {s.detailText}
                </div>

                {s.showProgressBar && (
                  <div className="mt-2">
                    <progress
                      className="progress progress-info w-full h-1.5"
                      value={s.progressPct}
                      max={100}
                    />
                    <div className="text-[10px] text-base-content/60 text-right mt-0.5">
                      {s.progressPct}%
                    </div>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {canRetry && (
                    <button
                      className="btn btn-xs btn-warning"
                      onClick={() => handleRetry(c)}
                    >
                      <span className="iconify lucide--rotate-cw size-3" />
                      重試失敗的 {d!.failedCount} 位
                    </button>
                  )}
                  {(isPartial || isAllFailed) && (
                    <Link
                      to={`/mail-center/logs`}
                      className="btn btn-xs btn-ghost"
                      onClick={() => dismiss(c.id)}
                    >
                      查看寄信紀錄
                    </Link>
                  )}
                  <Link
                    to={`/mail-center/campaigns`}
                    className="btn btn-xs btn-ghost"
                    onClick={() => dismiss(c.id)}
                  >
                    活動列表
                  </Link>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => dismiss(c.id)}
                aria-label="關閉"
              >
                <span className="iconify lucide--x size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
