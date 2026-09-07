import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { DemandTable } from '@/components/demands/DemandTable';
import { Pagination } from '@/components/common/Pagination';
import { ListToolbar } from '@/components/common/ListToolbar';
import { ProTrackSubscriptionModal } from '@/components/demands/ProTrackSubscriptionModal';
import { demandsApi } from '@/lib/api/demands';
import type { Demand, DemandSearchParams } from '@/types/demand';
import { useNotify } from '@/hooks/useNotify';

export const DemandsListPage = () => {
  const notify = useNotify();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<DemandSearchParams>({});
  const [searchInput, setSearchInput] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const pageSize = 20;

  const fetchDemands = async (page: number, params: DemandSearchParams) => {
    setIsLoading(true);
    try {
      const response = await demandsApi.getDemands(page, pageSize, params);
      setDemands(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch demands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands(1, searchParams);
  }, [searchParams]);

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      await demandsApi.togglePublish(id, published);
      fetchDemands(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      await notify.error('更新發布狀態失敗，請稍後再試');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await demandsApi.deleteDemand(id);
      fetchDemands(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to delete demand:', error);
      await notify.error('刪除需求失敗，請稍後再試');
    }
  };

  const hasFilters = searchParams.published !== undefined || searchParams.search;

  const handleClearFilter = () => {
    setSearchParams({});
    setSearchInput('');
  };

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}

      <ProTrackSubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      <PageTitle
        title="需求張貼管理"
        items={[{ label: '需求張貼管理', active: true }]}
      />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ListToolbar
            searchPlaceholder="搜尋需求名稱、內容、公司名稱..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={handleSearch}
            totalCount={demands.length}
            isLoading={isLoading}
            actions={
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  <span className="iconify lucide--rss size-4" />
                  管理訂閱
                </button>
                <Link to="/demands/new" className="btn btn-success">
                  <span className="iconify lucide--plus size-5" />
                  新增需求
                </Link>
              </div>
            }
            showClearFilter={!!hasFilters}
            onClearFilter={handleClearFilter}
            filters={
              <select
                className="select select-bordered select-sm"
                value={
                  searchParams.published === undefined
                    ? ''
                    : searchParams.published
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    published: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
              >
                <option value="">全部狀態</option>
                <option value="true">已發布</option>
                <option value="false">草稿</option>
              </select>
            }
          />

          {/* 需求表格 */}
          <DemandTable
            demands={demands}
            isLoading={isLoading}
            onTogglePublish={handleTogglePublish}
            onDelete={handleDelete}
          />

          {/* 分頁 */}
          {!isLoading && demands.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchDemands(page, searchParams)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
