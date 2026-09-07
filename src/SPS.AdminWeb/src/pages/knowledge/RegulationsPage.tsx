import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Link } from 'react-router-dom';
import { regulationsApi } from '@/lib/api/regulations';
import { categoriesApi } from '@/lib/api/category';
import { useConfirm } from '@/hooks/useConfirm';
import type { RegulationsResponse } from '@/types/regulations';
import type { CategoryResponse } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 法規分類的 type 值 (對應後端 CategoryType.Regulations = 4)
const REGULATIONS_CATEGORY_TYPE = 4;

export const RegulationsPage = () => {
  const notify = useNotify();
  const [regulations, setRegulations] = useState<RegulationsResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage] = useState(1);
  const { confirmDialog, ConfirmComponent } = useConfirm();

  // 載入類別列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategoriesByType(REGULATIONS_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    void fetchRegulations();
  }, [selectedCategory, currentPage]);

  const fetchRegulations = async () => {
    setIsLoading(true);
    try {
      if (selectedCategory) {
        const data = await regulationsApi.getByCategory(selectedCategory);
        setRegulations(data);
      } else {
        const data = await regulationsApi.getPaged(currentPage, 20);
        setRegulations(data);
      }
    } catch (error) {
      console.error('Failed to fetch regulations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRegulations = regulations.filter((regulation) => {
    const matchesSearch =
      (regulation.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (regulation.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (regulation.content?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesSearch;
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除法條', message: '確定要刪除此法條嗎？此操作無法復原。', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await regulationsApi.delete(id);
      await notify.success('法條刪除成功');
      await fetchRegulations();
    } catch (error) {
      console.error('Failed to delete regulation:', error);
      await notify.error('刪除法條失敗');
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="法條內文"
        items={[
          { label: '知識庫', path: '/knowledge' },
          { label: '法條內文', active: true },
        ]}
      />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="form-control flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜尋法條標題或條號..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-control">
          <select
            className="select select-bordered"
            value={selectedCategory ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategory(value === '' ? null : Number(value));
            }}
          >
            <option value="">全部類別</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {selectedCategory !== null && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedCategory(null)}
          >
            <span className="iconify lucide--x size-4" />
            清除篩選
          </button>
        )}
        <Link to="/knowledge/regulations/new/edit" className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增法條
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredRegulations.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--file-text size-16 mb-4" />
              <p>尚無法條資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>條號</th>
                    <th>標題</th>
                    <th>類別</th>
                    <th>狀態</th>
                    <th>瀏覽次數</th>
                    <th>更新時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegulations.map((regulation) => (
                    <tr key={regulation.id}>
                      <td>
                        <div className="font-mono font-semibold">{regulation.name || '-'}</div>
                      </td>
                      <td>
                        <div className="font-semibold">{regulation.title || regulation.name || '-'}</div>
                        <div className="text-sm text-base-content/70 max-w-md line-clamp-2">
                          {regulation.content || '-'}
                        </div>
                      </td>
                      <td>
                        {regulation.categoryName ? (
                          <span className="badge badge-primary">{regulation.categoryName}</span>
                        ) : (
                          <span className="text-sm text-base-content/60">未分類</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            regulation.published ? 'badge-success' : 'badge-ghost'
                          }`}
                        >
                          {regulation.published ? '已發布' : '草稿'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">-</span>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {regulation.updatedTime
                            ? new Date(regulation.updatedTime).toLocaleDateString('zh-TW')
                            : new Date(regulation.createdTime).toLocaleDateString('zh-TW')}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/knowledge/regulations/${regulation.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--eye size-4" />
                            查看
                          </Link>
                          <Link
                            to={`/knowledge/regulations/${regulation.id}/edit`}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--edit size-4" />
                            編輯
                          </Link>
                          <button
                            onClick={() => handleDelete(regulation.id)}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            <span className="iconify lucide--trash-2 size-4" />
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
