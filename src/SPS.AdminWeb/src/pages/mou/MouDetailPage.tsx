import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { MouStatusBadge } from '@/components/mou/MouStatusBadge';
import { mouApi } from '@/lib/api/mou';
import type { Mou } from '@/types/mou';
import { MouStatus } from '@/types/mou';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const MouDetailPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mou, setMou] = useState<Mou | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    const fetchMou = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await mouApi.getMouById(Number(id));
        setMou(data);
      } catch (error) {
        console.error('Failed to fetch MOU:', error);
        await notify.error('載入備忘錄失敗');
        navigate('/mou');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMou();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!mou) return;

    const confirmed = await confirmDialog({ cardTitle: '刪除備忘錄', message: '確定要刪除此備忘錄嗎？此操作無法復原。', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await mouApi.deleteMou(mou.id);
      navigate('/mou');
    } catch (error) {
      console.error('Failed to delete MOU:', error);
      await notify.error('刪除備忘錄失敗');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!mou) return;

    try {
      const updated = await mouApi.updateMouStatus(mou.id, newStatus as any);
      setMou(updated);
    } catch (error) {
      console.error('Failed to update MOU status:', error);
      await notify.error('更新狀態失敗');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = () => {
    if (!mou?.endDate) return null;
    const days = Math.floor((new Date(mou.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return '已過期';
    return `還有 ${days} 天`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!mou) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="iconify lucide--alert-circle size-16 text-error mb-4" />
          <p className="text-lg">找不到此備忘錄</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="備忘錄詳情"
        items={[
          { label: '備忘錄管理', path: '/mou' },
          { label: mou.title, active: true },
        ]}
      />

      {/* 操作列 */}
      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <div className="flex-1" />
        <Link to={`/mou/${id}/edit`} className="btn btn-neutral">
          <span className="iconify lucide--edit size-4" />
          編輯
        </Link>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-info">
            <span className="iconify lucide--settings size-4" />
            更新狀態
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <button onClick={() => handleUpdateStatus(MouStatus.Active)}>
                <span className="iconify lucide--check-circle size-4" />
                設為有效
              </button>
            </li>
            <li>
              <button onClick={() => handleUpdateStatus(MouStatus.Expired)}>
                <span className="iconify lucide--calendar-x size-4" />
                設為過期
              </button>
            </li>
            <li>
              <button onClick={() => handleUpdateStatus(MouStatus.Terminated)}>
                <span className="iconify lucide--x-circle size-4" />
                設為終止
              </button>
            </li>
          </ul>
        </div>
        <button onClick={handleDelete} className="btn btn-error">
          <span className="iconify lucide--trash-2 size-4" />
          刪除
        </button>
      </div>

      {/* 狀態卡片 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{mou.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-base-content/60">
                <span>建立時間：{formatDateTime(mou.createdTime)}</span>
                {mou.updatedTime && <span>最後更新：{formatDateTime(mou.updatedTime)}</span>}
              </div>
            </div>
            <div>
              <MouStatusBadge status={mou.status} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 備忘錄資訊 */}
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title mb-4">
              <span className="iconify lucide--file-text size-6" />
              備忘錄內容
            </h3>

            {mou.description ? (
              <div className="prose max-w-none">
                <div className="p-6 bg-base-200 rounded-lg whitespace-pre-wrap">
                  {mou.description}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/40">
                <span className="iconify lucide--file-text size-12 mb-2" />
                <p>暫無內容描述</p>
              </div>
            )}

            {/* 附件列表 */}
            {mou.attachments && mou.attachments.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium text-base-content/60 mb-3">附件檔案</div>
                <div className="space-y-2">
                  {mou.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <span className="iconify lucide--file size-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{file}</div>
                      </div>
                      <button className="btn btn-sm btn-ghost">
                        <span className="iconify lucide--download size-4" />
                        下載
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 側邊欄資訊 */}
        <div className="space-y-6">
          {/* 簽署公司 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--building size-5" />
                簽署公司
              </h3>
              <div>
                <Link
                  to={`/companies/${mou.companyId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {mou.companyName}
                </Link>
              </div>
            </div>
          </div>

          {/* 時間資訊 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--calendar size-5" />
                時間資訊
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-1">簽署日期</div>
                  <div className="text-base-content">{formatDate(mou.signDate)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-base-content/60 mb-1">生效日期</div>
                  <div className="text-base-content">{formatDate(mou.startDate)}</div>
                </div>

                {mou.endDate && (
                  <div>
                    <div className="text-sm font-medium text-base-content/60 mb-1">到期日期</div>
                    <div className="text-base-content">{formatDate(mou.endDate)}</div>
                    <div className="text-sm text-base-content/60 mt-1">{getDaysRemaining()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">
                <span className="iconify lucide--zap size-5" />
                快速操作
              </h3>

              <div className="space-y-2">
                <Link to={`/mou/${id}/edit`} className="btn btn-block btn-sm btn-neutral">
                  <span className="iconify lucide--edit size-4" />
                  編輯備忘錄
                </Link>
                <button className="btn btn-block btn-sm btn-ghost">
                  <span className="iconify lucide--printer size-4" />
                  列印備忘錄
                </button>
                <button className="btn btn-block btn-sm btn-ghost">
                  <span className="iconify lucide--share-2 size-4" />
                  分享備忘錄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
