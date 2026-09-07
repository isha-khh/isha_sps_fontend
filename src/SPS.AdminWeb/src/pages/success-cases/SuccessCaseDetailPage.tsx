import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { PuckRenderer } from '@/components/puck/PuckRenderer';
import { successCasesApi } from '@/lib/api/success-cases';
import type { SuccessCase } from '@/types/success-case';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const SuccessCaseDetailPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [successCase, setSuccessCase] = useState<SuccessCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    if (id) {
      fetchSuccessCase(Number(id));
    }
  }, [id]);

  const fetchSuccessCase = async (caseId: number) => {
    setIsLoading(true);
    try {
      const data = await successCasesApi.getSuccessCaseById(caseId);
      setSuccessCase(data);
    } catch (error) {
      console.error('Failed to fetch success case:', error);
      await notify.success('無法載入成功案例');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!successCase) return;

    try {
      await successCasesApi.togglePublish(successCase.id, !successCase.isPublished);
      setSuccessCase({ ...successCase, isPublished: !successCase.isPublished });
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      await notify.error('更新發布狀態失敗');
    }
  };

  const handleDelete = async () => {
    if (!successCase) return;

    const confirmed = await confirmDialog({
      cardTitle: '刪除成功案例',
      message: '確定要刪除此成功案例嗎？',
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await successCasesApi.deleteSuccessCase(successCase.id);
      navigate('/success-cases');
    } catch (error) {
      console.error('Failed to delete success case:', error);
      await notify.success('刪除成功案例失敗');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!successCase) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/60">找不到此成功案例</p>
        <Link to="/success-cases" className="btn btn-neutral mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="成功案例詳情"
        items={[
          { label: '成功案例', path: '/success-cases' },
          { label: successCase.title, active: true },
        ]}
      />

      <div className="flex gap-4 justify-end">
        <Link to={`/success-cases/${successCase.id}/edit`} className="btn btn-neutral">
          <span className="iconify lucide--edit size-5" />
          編輯
        </Link>
        <button onClick={handleTogglePublish} className="btn btn-ghost">
          <span
            className={`iconify ${successCase.isPublished ? 'lucide--eye-off' : 'lucide--eye'} size-5`}
          />
          {successCase.isPublished ? '取消發布' : '發布'}
        </button>
        <button onClick={handleDelete} className="btn btn-ghost text-error">
          <span className="iconify lucide--trash-2 size-5" />
          刪除
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要內容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 封面圖片 */}
          {successCase.coverImageUrl && (
            <div className="card bg-base-100 shadow">
              <figure className="h-96">
                <img
                  src={successCase.coverImageUrl}
                  alt={successCase.title}
                  className="w-full h-full object-cover"
                />
              </figure>
            </div>
          )}

          {/* 標題與摘要 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold flex-1">{successCase.title}</h1>
                {successCase.isPublished ? (
                  <span className="badge badge-success">已發布</span>
                ) : (
                  <span className="badge badge-warning">草稿</span>
                )}
              </div>
              <p className="text-lg text-base-content/70 mt-2">{successCase.summary}</p>
            </div>
          </div>

          {/* 詳細內容 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">案例詳情</h2>
              <div className="rounded-lg overflow-hidden">
                <PuckRenderer content={successCase.content} />
              </div>
            </div>
          </div>
        </div>

        {/* 側邊欄資訊 */}
        <div className="space-y-6">
          {/* 基本資訊 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">基本資訊</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-base-content/60 mb-1">公司名稱</div>
                  <div className="font-medium">{successCase.companyName}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60 mb-1">產業類別</div>
                  <div>
                    <span className="badge badge-outline">{successCase.industry}</span>
                  </div>
                </div>
                {successCase.publishedDate && (
                  <div>
                    <div className="text-sm text-base-content/60 mb-1">發布日期</div>
                    <div className="font-medium">
                      {new Date(successCase.publishedDate).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-base-content/60 mb-1">瀏覽次數</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className="iconify lucide--eye size-4" />
                    {successCase.viewCount} 次
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 標籤 */}
          {successCase.tags && successCase.tags.length > 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-lg">相關標籤</h2>
                <div className="flex flex-wrap gap-2">
                  {successCase.tags.map((tag, index) => (
                    <span key={index} className="badge badge-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 時間資訊 */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">時間資訊</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">建立時間</span>
                  <span>{new Date(successCase.createdTime).toLocaleString('zh-TW')}</span>
                </div>
                {successCase.updatedTime && (
                  <div className="flex justify-between">
                    <span className="text-base-content/60">更新時間</span>
                    <span>{new Date(successCase.updatedTime).toLocaleString('zh-TW')}</span>
                  </div>
                )}
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
