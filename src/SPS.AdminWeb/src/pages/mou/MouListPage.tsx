import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { SearchBar } from '@/components/common/SearchBar';
import { MouTable } from '@/components/mou/MouTable';
import { mouApi } from '@/lib/api/mou';
import type { Mou, MouSearchParams } from '@/types/mou';
import { MouStatus } from '@/types/mou';
import { useNotify } from '@/hooks/useNotify';

export const MouListPage = () => {
  const notify = useNotify();
  const [mous, setMous] = useState<Mou[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 搜尋與篩選參數
  const [searchParams, setSearchParams] = useState<MouSearchParams>({});
  const [searchText, setSearchText] = useState('');

  // 載入 MOU 列表
  const fetchMous = async () => {
    setIsLoading(true);
    try {
      const response = await mouApi.getMous(currentPage, pageSize, searchParams);
      setMous(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch MOUs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMous();
  }, [currentPage, searchParams]);

  // 刪除 MOU
  const handleDelete = async (id: number) => {
    try {
      await mouApi.deleteMou(id);
      fetchMous();
    } catch (error) {
      console.error('Failed to delete MOU:', error);
      await notify.error('刪除備忘錄失敗');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle
        title="備忘錄管理"
        items={[{ label: '備忘錄管理', path: '/mou' }, { label: '備忘錄列表', active: true }]}
      />

      {/* 操作列 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <SearchBar
          placeholder="搜尋備忘錄標題、公司名稱..."
          value={searchText}
          onChange={setSearchText}
          onSearch={() => {
            setSearchParams((prev) => ({ ...prev, search: searchText }));
            setCurrentPage(1);
          }}
        />
        <Link to="/mou/new/edit" className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增備忘錄
        </Link>
      </div>

      {/* 篩選器 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            {/* 狀態篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">狀態</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.status ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    status: value === '' ? undefined : (value as any),
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部狀態</option>
                <option value={MouStatus.Draft}>草稿</option>
                <option value={MouStatus.Active}>有效</option>
                <option value={MouStatus.Expired}>已過期</option>
                <option value={MouStatus.Terminated}>已終止</option>
              </select>
            </div>

            {/* 重置篩選 */}
            {(searchParams.status !== undefined) && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text opacity-0">Reset</span>
                </label>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearchParams({});
                    setSearchText('');
                    setCurrentPage(1);
                  }}
                >
                  <span className="iconify lucide--x size-5" />
                  清除篩選
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="flex items-center justify-between text-sm text-base-content/60">
        <div>
          共找到 <span className="font-semibold text-base-content">{totalCount}</span> 筆備忘錄
        </div>
        {totalPages > 1 && (
          <div>
            第 <span className="font-semibold text-base-content">{currentPage}</span> /{' '}
            {totalPages} 頁
          </div>
        )}
      </div>

      {/* MOU 列表 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <MouTable mous={mous} isLoading={isLoading} onDelete={handleDelete} />
        </div>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (page <= 3 || page > totalPages - 3) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <div key={`ellipsis-${page}`}>
                      <button className="join-item btn btn-disabled">...</button>
                      <button
                        className={`join-item btn ${page === currentPage ? 'btn-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={page}
                    className={`join-item btn ${page === currentPage ? 'btn-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
            <button
              className="join-item btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
