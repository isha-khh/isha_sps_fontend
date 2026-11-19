import { useEffect, useState } from 'react';
import { contentCheckApi } from '@/lib/api/content-check';
import { useNotify } from '@/hooks/useNotify';
import { isContentCheckActive, useContentCheckStore } from '@/stores/content-check-store';
import { CONTENT_CHECK_KIND_LABELS } from '@/types/content-check';

/**
 * 系統設定 →「內容檢查」：逐篇檢查所有已發布的文章（公告、常見問題、產業案例、法規），
 * 有問題的依選項轉成草稿並寫下原因（文章編輯頁上方會顯示）。背景執行，進度即時推到右上角鈴鐺（SignalR）。
 * 規則跟後台編輯器發布前的檢查一致（lib/puck/content-rules.ts、後端 ArticleContentRules）。
 */
export const ContentCheckSection = () => {
  const notify = useNotify();
  const job = useContentCheckStore((s) => s.job);
  const apply = useContentCheckStore((s) => s.apply);
  const [starting, setStarting] = useState(false);

  // 進入這一頁時查一次最近的任務（重新整理後還看得到上次結果；即時更新由 AdminLayout 的 SignalR 負責）
  useEffect(() => {
    let cancelled = false;
    contentCheckApi
      .getStatus()
      .then((latest) => {
        if (!cancelled && latest) apply(latest, { fromStatusQuery: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const active = isContentCheckActive(job);

  const start = async (applyDraft: boolean) => {
    if (applyDraft) {
      const ok = await notify.confirm(
        '會逐篇檢查所有已發布的文章，有問題的會被轉成草稿（前台立刻看不到），原因寫在文章編輯頁上方。\n建議先用「預覽」看會影響哪些文章。確定要檢查並轉草稿嗎？',
        '檢查並轉草稿'
      );
      if (!ok) return;
    }
    setStarting(true);
    try {
      const res = await contentCheckApi.start(applyDraft);
      apply(res.job);
      if (res.alreadyActive) notify.info('已經有一個內容檢查正在進行，右上角鈴鐺可以看進度。');
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      notify.error(message || '無法開始內容檢查，請稍後再試');
    } finally {
      setStarting(false);
    }
  };

  const cancel = async () => {
    if (!job) return;
    try {
      await contentCheckApi.cancel(job.id);
    } catch {
      notify.error('取消失敗，任務可能剛好結束了');
    }
  };

  const statusLabel: Record<string, string> = { Queued: '等待開始', Running: '進行中', Completed: '已完成', Cancelled: '已取消', Failed: '中斷' };

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title">內容檢查</h2>
            <p className="text-base-content/70 mt-1 text-sm">
              逐篇檢查所有<b>已發布</b>的公告、常見問題、產業案例、法規，找出不符合無障礙規則的內容。進度會即時顯示在右上角的鈴鐺。
            </p>
          </div>

          <div className="bg-base-200/50 rounded-box p-4 text-sm">
            <p className="font-medium">會被視為「錯誤」的情況</p>
            <ul className="text-base-content/80 mt-1 list-disc space-y-0.5 ps-5">
              <li>區塊標題跳級（文章標題是 H2，內容裡的標題不能從 H2 直接跳到 H4）</li>
              <li>圖片區塊沒有替代文字</li>
              <li>還留著編輯器的預設範例文字「這是一張範例圖片」</li>
            </ul>
            <p className="text-base-content/60 mt-2 text-xs">
              選「轉草稿」時，有錯誤的文章會被轉成草稿並寫下原因；補好內容重新發布後，原因會自動清掉。連結文字太籠統這類只是「提醒」，不會轉草稿。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-outline" disabled={active || starting} onClick={() => void start(false)}>
              <span className="iconify lucide--search-check size-4" />
              預覽（只檢查，不動文章）
            </button>
            <button type="button" className="btn btn-warning" disabled={active || starting} onClick={() => void start(true)}>
              <span className="iconify lucide--file-warning size-4" />
              檢查並把有問題的轉草稿
            </button>
            {active && job && (
              <button type="button" className="btn btn-ghost" onClick={() => void cancel()}>
                取消
              </button>
            )}
          </div>
        </div>
      </div>

      {job && (
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                最近一次：{statusLabel[job.status] ?? job.status}
                <span className="text-base-content/60 ms-2 text-sm font-normal">
                  {job.applyDraft ? '檢查並轉草稿' : '預覽'}
                  {job.requestedBy ? `・${job.requestedBy}` : ''}
                  {job.finishedAt ? `・${new Date(job.finishedAt).toLocaleString('zh-TW')}` : ''}
                </span>
              </h3>
              <span className="text-sm">
                已檢查 {job.checked} / {job.total} 篇・有問題 {job.flagged} 篇
                {job.applyDraft ? `・已轉草稿 ${job.drafted} 篇` : ''}
              </span>
            </div>

            {active && (
              <div>
                <progress className="progress progress-info w-full" value={job.percent} max={100} aria-label="內容檢查進度" />
                <div className="text-base-content/60 text-right text-xs">{job.percent}%</div>
              </div>
            )}

            {job.error && <div className="alert alert-error text-sm">{job.error}</div>}

            {job.findings.length === 0 ? (
              !active && job.status === 'Completed' && <p className="text-success text-sm">沒有發現需要處理的文章。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th className="w-24">種類</th>
                      <th className="w-16">編號</th>
                      <th>標題</th>
                      <th>原因</th>
                      <th className="w-24">結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.findings.map((f) => (
                      <tr key={`${f.kind}-${f.id}`}>
                        <td>{CONTENT_CHECK_KIND_LABELS[f.kind] ?? f.kind}</td>
                        <td>#{f.id}</td>
                        <td className="max-w-48 truncate" title={f.title ?? ''}>{f.title || '（無標題）'}</td>
                        <td className="text-xs whitespace-pre-line">{f.reason.replace(/^內容檢查（[^）]*）發現 \d+ 個問題(，已自動轉為草稿)?：/, '').replace(/。請修正後重新發布。$/, '').replace(/。$/, '')}</td>
                        <td>
                          {f.drafted ? <span className="badge badge-warning badge-sm">已轉草稿</span> : <span className="badge badge-ghost badge-sm">預覽</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {job.flagged > job.findings.length && (
                  <p className="text-base-content/60 mt-2 text-xs">只列出前 {job.findings.length} 篇，其餘請看各文章編輯頁。</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
