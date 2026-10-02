import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { scoringApi } from '@/lib/api/scoring';
import { useNotify } from '@/hooks/useNotify';
import {
  QUALIFYING_SCORE,
  SCORE_CRITERIA,
  type AddExpertScoreRequest,
  type ScoreField,
  type ScoringSummary,
} from '@/types/scoring';

/** 官方規定新興會員至少要有 5 位專家審查（見《會員申請須知》附件三） */
const MIN_EXPERTS = 5;

type ScoreInputs = Record<ScoreField, string>;

const emptyInputs = (): ScoreInputs => ({
  humanResourcesScore: '',
  teamExperienceScore: '',
  relevantExperienceScore: '',
  financialSystemScore: '',
  productTrackRecordScore: '',
  financialStatusScore: '',
});

function errorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}

interface Props {
  applicationId: string;
  /** 申請已核准/退回後不能再新增或刪除評分，只能檢視 */
  editable: boolean;
  /** 評分有異動後通知上層（例如重新抓申請資料以更新評分警示） */
  onChanged?: () => void;
}

/**
 * 新興會員委員評分區塊。外部專家沒有後台帳號，專家線下給分後由內部
 * 審核人員代為輸入：一位專家一筆，6 項子分數（0-100）依權重加總成這位
 * 專家的總分，總分 >= 70 算合格，合格專家達半數（含）以上即通過
 * （官方《會員申請須知》附件三）。加權總分、合格判斷都以後端回傳為準，
 * 這裡只在表單上即時預覽，方便輸入時對照。
 *
 * 通過與否只是提供審核員參考的警示，不會阻擋核准——是否核准仍由
 * 審核員人工決定。
 */
export const ExpertScoringSection = ({ applicationId, editable, onChanged }: Props) => {
  const notify = useNotify();
  const [summary, setSummary] = useState<ScoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expertName, setExpertName] = useState('');
  const [inputs, setInputs] = useState<ScoreInputs>(emptyInputs);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await scoringApi.getSummary(applicationId));
    } catch (err) {
      notify.error(errorMessage(err, '載入委員評分失敗'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewTotal = useMemo(() => {
    return SCORE_CRITERIA.reduce((sum, c) => {
      const v = Number(inputs[c.field]);
      return sum + (Number.isFinite(v) ? (v * c.weight) / 100 : 0);
    }, 0);
  }, [inputs]);

  const allFilled = SCORE_CRITERIA.every((c) => inputs[c.field] !== '');

  const handleAdd = async () => {
    if (!expertName.trim()) {
      notify.error('請輸入專家姓名');
      return;
    }
    const payload: Partial<AddExpertScoreRequest> = { expertName: expertName.trim() };
    for (const c of SCORE_CRITERIA) {
      const raw = inputs[c.field];
      const v = Number(raw);
      if (raw === '' || !Number.isFinite(v) || v < 0 || v > 100) {
        notify.error(`「${c.label}」請輸入 0-100 的分數`);
        return;
      }
      payload[c.field] = v;
    }

    setSubmitting(true);
    try {
      await scoringApi.addExpertScore(applicationId, payload as AddExpertScoreRequest);
      setExpertName('');
      setInputs(emptyInputs());
      await load();
      onChanged?.();
    } catch (err) {
      notify.error(errorMessage(err, '新增評分失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (scoringId: number, name: string) => {
    if (!confirm(`確定要刪除「${name || '未具名專家'}」的評分嗎？`)) return;
    try {
      await scoringApi.deleteExpertScore(applicationId, scoringId);
      await load();
      onChanged?.();
    } catch (err) {
      notify.error(errorMessage(err, '刪除評分失敗'));
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      {notify.NotifyComponent}
      <div className="card-body">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span className="iconify lucide--clipboard-check size-5" />
          委員評分（新興會員）
        </h3>
        <p className="text-sm text-base-content/60 mb-4">
          至少 {MIN_EXPERTS} 位外部專家審查；各專家 6 項子分數加權後總分 ≥ {QUALIFYING_SCORE} 分為合格，
          合格專家達半數（含）以上即通過。結果僅供審核參考，不會自動核准或退回。
        </p>

        {loading ? (
          <span className="loading loading-spinner" />
        ) : (
          summary && (
            <>
              <div
                className={`alert mb-4 ${
                  summary.totalCount === 0 ? 'alert-warning' : summary.isPassed ? 'alert-success' : 'alert-error'
                }`}
              >
                <span>
                  {summary.totalCount === 0
                    ? '尚未輸入任何委員評分'
                    : `${summary.qualifiedCount}/${summary.totalCount} 位專家合格 — ${
                        summary.isPassed ? '已達通過門檻' : '未達通過門檻'
                      }`}
                  {summary.totalCount > 0 && summary.totalCount < MIN_EXPERTS &&
                    `（目前 ${summary.totalCount} 位，未滿官方要求的 ${MIN_EXPERTS} 位）`}
                </span>
              </div>

              {summary.experts.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>專家</th>
                        <th>加權總分</th>
                        <th>結果</th>
                        {editable && <th>操作</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.experts.map((e, i) => (
                        <tr key={e.scoringId}>
                          <td>{i + 1}</td>
                          <td>{e.expertName || '-'}</td>
                          <td>{e.totalScore.toFixed(1)}</td>
                          <td>
                            <span className={`badge ${e.isQualified ? 'badge-success' : 'badge-error'}`}>
                              {e.isQualified ? '合格' : '不合格'}
                            </span>
                          </td>
                          {editable && (
                            <td>
                              <button
                                className="btn btn-xs btn-ghost text-error"
                                title="刪除"
                                onClick={() => void handleDelete(e.scoringId, e.expertName)}
                              >
                                <span className="iconify lucide--trash-2 size-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}

        {editable && (
          <div className="rounded-box border border-base-300 p-4">
            <h4 className="font-medium mb-3">新增一位專家的評分</h4>
            <div className="form-control mb-3 max-w-xs">
              <label className="label">
                <span className="label-text">專家姓名</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={expertName}
                maxLength={100}
                onChange={(e) => setExpertName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SCORE_CRITERIA.map((c) => (
                <div className="form-control" key={c.field}>
                  <label className="label">
                    <span className="label-text">
                      {c.label}
                      <span className="text-base-content/50">（{c.weight}%）</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    className="input input-bordered"
                    value={inputs[c.field]}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [c.field]: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-base-content/70">
                加權總分預覽：
                <span className={`font-semibold ${allFilled && previewTotal >= QUALIFYING_SCORE ? 'text-success' : ''}`}>
                  {allFilled ? previewTotal.toFixed(1) : '-'}
                </span>
              </span>
              <button className="btn btn-primary btn-sm" onClick={() => void handleAdd()} disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--plus size-4" />}
                新增評分
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
