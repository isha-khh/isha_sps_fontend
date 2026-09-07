import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { successCasesApi } from '@/lib/api/success-cases';
import type { SuccessCase, SuccessCaseSearchParams } from '@/types/success-case';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const SuccessCasesListPage = () => {
  const notify = useNotify();
  const [cases, setCases] = useState<SuccessCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const { confirmDialog, ConfirmComponent } = useConfirm();

  // 搜尋與篩選參數
  const [searchParams, setSearchParams] = useState<SuccessCaseSearchParams>({});
  const [searchText, setSearchText] = useState('');

  // 載入成功案例列表
  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const response = await successCasesApi.getSuccessCases(currentPage, pageSize, searchParams);
      setCases(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch success cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [currentPage, searchParams]);

  // 搜尋處理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, search: searchText }));
    setCurrentPage(1);
  };

  // 切換發布狀態
  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      await successCasesApi.togglePublish(id, isPublished);
      fetchCases();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      await notify.error('更新發布狀態失敗');
    }
  };

  // 刪除成功案例
  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({
      cardTitle: '刪除成功案例',
      message: '確定要刪除此成功案例嗎？',
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await successCasesApi.deleteSuccessCase(id);
      fetchCases();
    } catch (error) {
      console.error('Failed to delete success case:', error);
      await notify.success('刪除成功案例失敗');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="成功案例"
        items={[{ label: '成功案例', path: '/success-cases' }, { label: '案例列表', active: true }]}
      />

      {/* 操作列 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜尋案例標題、公司名稱..."
            className="input input-bordered flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button type="submit" className="btn btn-neutral">
            <span className="iconify lucide--search size-5" />
            搜尋
          </button>
        </form>

        <div className="flex gap-2">
          <Link to="/success-cases/new/edit" className="btn btn-success">
            <span className="iconify lucide--plus size-5" />
            新增案例
          </Link>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            {/* 發布狀態篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">發布狀態</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.isPublished === undefined ? '' : String(searchParams.isPublished)}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    isPublished: value === '' ? undefined : value === 'true',
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部</option>
                <option value="true">已發布</option>
                <option value="false">草稿</option>
              </select>
            </div>

            {/* 產業篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">產業類別</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.industry ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    industry: value === '' ? undefined : value,
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部產業</option>
                <option value="石化製造業">石化製造業</option>
                <option value="塑膠原料製造業">塑膠原料製造業</option>
                <option value="化學原料製造業">化學原料製造業</option>
                <option value="合成樹脂製造業">合成樹脂製造業</option>
                <option value="化學纖維製造業">化學纖維製造業</option>
              </select>
            </div>

            {/* 重置篩選 */}
            {(searchParams.isPublished !== undefined || searchParams.industry !== undefined) && (
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
          共找到 <span className="font-semibold text-base-content">{totalCount}</span> 個案例
        </div>
        {totalPages > 1 && (
          <div>
            第 <span className="font-semibold text-base-content">{currentPage}</span> / {totalPages} 頁
          </div>
        )}
      </div>

      {/* 成功案例網格 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : cases.length === 0 ? (
          <div className="col-span-full text-center py-12 text-base-content/60">
            <span className="iconify lucide--award size-16 mb-4" />
            <p>沒有找到成功案例</p>
          </div>
        ) : (
          cases.map((successCase) => (
            <div key={successCase.id} className="card bg-base-100 shadow">
              <figure className="h-48 bg-base-200">
                {successCase.coverImageUrl ? (
                  <img
                    src={successCase.coverImageUrl}
                    alt={successCase.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="iconify lucide--image size-16 text-base-content/20" />
                  </div>
                )}
              </figure>
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <h2 className="card-title flex-1 line-clamp-2">{successCase.title}</h2>
                  {successCase.isPublished ? (
                    <span className="badge badge-success badge-sm">已發布</span>
                  ) : (
                    <span className="badge badge-warning badge-sm">草稿</span>
                  )}
                </div>
                <p className="text-sm text-base-content/70 line-clamp-2">{successCase.summary}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-outline badge-sm">{successCase.companyName}</span>
                  <span className="badge badge-ghost badge-sm">{successCase.industry}</span>
                </div>
                {successCase.tags && successCase.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {successCase.tags.map((tag, index) => (
                      <span key={index} className="badge badge-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-base-content/60 mt-2">
                  <span className="iconify lucide--eye size-3" />
                  <span>{successCase.viewCount} 次瀏覽</span>
                </div>
                <div className="card-actions justify-end mt-4">
                  <Link to={`/success-cases/${successCase.id}`} className="btn btn-sm btn-neutral">
                    <span className="iconify lucide--eye size-4" />
                    查看
                  </Link>
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-sm btn-ghost">
                      <span className="iconify lucide--more-vertical size-4" />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <Link to={`/success-cases/${successCase.id}/edit`}>
                          <span className="iconify lucide--edit size-4" />
                          編輯
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => handleTogglePublish(successCase.id, !successCase.isPublished)}
                        >
                          <span
                            className={`iconify ${successCase.isPublished ? 'lucide--eye-off' : 'lucide--eye'} size-4`}
                          />
                          {successCase.isPublished ? '取消發布' : '發布'}
                        </button>
                      </li>
                      <li className="border-t border-base-300 mt-1 pt-1">
                        <button onClick={() => handleDelete(successCase.id)} className="text-error">
                          <span className="iconify lucide--trash-2 size-4" />
                          刪除
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
