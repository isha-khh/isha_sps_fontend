import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { demandsApi } from '@/lib/api/demands';
import type { Demand } from '@/types/demand';

export const DemandDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDemand = async () => {
      setIsLoading(true);
      try {
        const data = await demandsApi.getDemandById(id);
        setDemand(data);
      } catch (error) {
        console.error('Failed to fetch demand:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemand();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <span className="iconify lucide--file-question size-16 mb-4 text-base-content/40" />
        <p className="text-lg text-base-content/60">需求不存在</p>
        <button onClick={() => navigate('/demands')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="需求詳情"
        items={[
          { label: '需求張貼管理', path: '/demands' },
          { label: '詳情', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <Link to={`/demands/${demand.id}/edit`} className="btn btn-primary">
          <span className="iconify lucide--edit size-4" />
          編輯
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="card-title text-2xl mb-2">{demand.name}</h2>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <span className="iconify lucide--calendar size-4" />
                建立於 {formatDate(demand.createdAt)}
              </div>
            </div>
            <div>
              {demand.published ? (
                <span className="badge badge-success badge-lg">
                  <span className="iconify lucide--eye size-4 mr-1" />
                  已發布
                </span>
              ) : (
                <span className="badge badge-warning badge-lg">
                  <span className="iconify lucide--eye-off size-4 mr-1" />
                  草稿
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="iconify lucide--info size-5" />
                基本資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">發布公司</span>
                  </label>
                  {demand.companyName ? (
                    <p className="text-base-content flex items-center gap-2">
                      <span className="iconify lucide--building-2 size-4" />
                      {demand.companyName}
                    </p>
                  ) : (
                    <p className="text-base-content/50">未指定</p>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">發布人</span>
                  </label>
                  <p className="text-base-content">{demand.createdByName || '-'}</p>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* 需求內容 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="iconify lucide--file-text size-5" />
                需求內容
              </h3>
              <div className="prose max-w-none">
                {demand.introduction ? (
                  <p className="whitespace-pre-wrap text-base-content">
                    {demand.introduction}
                  </p>
                ) : (
                  <p className="text-base-content/50">無詳細說明</p>
                )}
              </div>
            </div>

            <div className="divider" />

            {/* 系統資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="iconify lucide--clock size-5" />
                系統資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">建立時間</span>
                  </label>
                  <p className="text-sm text-base-content/70">{formatDate(demand.createdAt)}</p>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">最後更新</span>
                  </label>
                  <p className="text-sm text-base-content/70">{formatDate(demand.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
