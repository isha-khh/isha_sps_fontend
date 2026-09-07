import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { NewsTable } from '@/components/news/NewsTable';
import { newsApi } from '@/lib/api/news';
import { categoriesApi } from '@/lib/api/category';
import type { News, NewsSearchParams } from '@/types/news';
import type { CategoryResponse } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 公告分類的 type 值 (對應後端 CategoryType.News = 1)
const NEWS_CATEGORY_TYPE = 1;

export const NewsListPage = () => {
  const notify = useNotify();
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 搜尋與篩選參數
  const [searchParams, setSearchParams] = useState<NewsSearchParams>({});
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // 載入公告列表
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await newsApi.getNews(currentPage, pageSize, searchParams);
      setNews(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 載入分類列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(NEWS_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [currentPage, searchParams]);

  // 搜尋處理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, search: searchText }));
    setCurrentPage(1);
  };

  // 切換發布狀態
  const handleTogglePublish = async (id: number, published: boolean) => {
    try {
      await newsApi.togglePublish(id, published);
      fetchNews();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      await notify.error('更新發布狀態失敗');
    }
  };

  // 刪除公告
  const handleDelete = async (id: number) => {
    try {
      await newsApi.deleteNews(id);
      fetchNews();
    } catch (error) {
      console.error('Failed to delete news:', error);
      await notify.error('刪除公告失敗');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle
        title="公告管理"
        items={[{ label: '內容管理', path: '/announcements' }, { label: '公告內容', active: true }]}
      />

      {/* 操作列 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜尋公告標題或內容..."
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
          <Link to="/announcements/new/edit" className="btn btn-success">
            <span className="iconify lucide--plus size-5" />
            新增公告
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
                value={searchParams.published === undefined ? '' : String(searchParams.published)}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    published: value === '' ? undefined : value === 'true',
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部</option>
                <option value="true">已發布</option>
                <option value="false">草稿</option>
              </select>
            </div>

            {/* 分類篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">公告分類</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.categoryId ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    categoryId: value === '' ? undefined : Number(value),
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 類型篩選 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">公告類型</span>
              </label>
              <select
                className="select select-bordered"
                value={searchParams.type ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchParams((prev) => ({
                    ...prev,
                    type: value === '' ? undefined : Number(value),
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">全部類型</option>
                <option value="0">一般公告</option>
                <option value="1">重要公告</option>
                <option value="2">緊急公告</option>
              </select>
            </div>

            {/* 重置篩選 */}
            {(searchParams.published !== undefined ||
              searchParams.categoryId !== undefined ||
              searchParams.type !== undefined) && (
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
          共找到 <span className="font-semibold text-base-content">{totalCount}</span> 筆公告
        </div>
        {totalPages > 1 && (
          <div>
            第 <span className="font-semibold text-base-content">{currentPage}</span> /{' '}
            {totalPages} 頁
          </div>
        )}
      </div>

      {/* 公告列表 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <NewsTable
            news={news}
            isLoading={isLoading}
            onTogglePublish={handleTogglePublish}
            onDelete={handleDelete}
          />
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
                // 顯示前3頁、後3頁和當前頁附近的頁碼
                if (page <= 3 || page > totalPages - 3) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, index, array) => {
                // 在間隔處顯示省略號
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
