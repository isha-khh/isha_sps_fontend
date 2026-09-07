import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Link } from 'react-router-dom';
import { questionsApi } from '@/lib/api/questions';
import { categoriesApi } from '@/lib/api/category';
import type { QuestionResponse } from '@/types/question';
import type { CategoryResponse } from '@/types/category';
import { MessageSquare } from "lucide-react";
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

// 問答分類的 type 值 (對應後端 CategoryType.Question = 3)
const QUESTION_CATEGORY_TYPE = 3;

export const FaqPage = () => {
  const notify = useNotify();
  const [faqs, setFaqs] = useState<QuestionResponse[]>([]);
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
        const data = await categoriesApi.getCategoriesByType(QUESTION_CATEGORY_TYPE);
        setCategories(data.filter(c => c.published));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    void fetchFaqs();
  }, [selectedCategory, currentPage]);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      if (selectedCategory) {
        const data = await questionsApi.getByCategory(selectedCategory);
        setFaqs(data);
      } else {
        const data = await questionsApi.getPaged(currentPage, 20);
        setFaqs(data);
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      (faq.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (faq.answer?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesSearch;
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除問題', message: '確定要刪除此問題嗎？此操作無法復原。', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await questionsApi.delete(id);
      await notify.success('問題刪除成功');
      await fetchFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      await notify.error('刪除問題失敗');
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="問題回覆"
        items={[
          { label: '知識庫', path: '/knowledge' },
          { label: '問題回覆', active: true },
        ]}
      />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="form-control flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜尋問題或答案..."
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
        <Link to="/knowledge/faq/new/edit" className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增問題
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
               <MessageSquare className={"iconify size-16 mb-4 bg-transparent"} />
              <p>尚無常見問題</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>問題</th>
                    <th>答案</th>
                    <th>類別</th>
                    <th>排序</th>
                    <th>狀態</th>
                    <th>瀏覽次數</th>
                    <th>更新時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>
                        <div className="font-semibold max-w-xs line-clamp-2">{faq.subject || '-'}</div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70 max-w-md line-clamp-2">
                          {faq.answer ? (() => {
                            try {
                              const data = JSON.parse(faq.answer);
                              const texts = (data.content ?? [])
                                .map((c: { props?: { content?: string; title?: string; subtitle?: string } }) => {
                                  const raw = c.props?.content ?? c.props?.title ?? c.props?.subtitle ?? '';
                                  return raw.replace(/<[^>]*>/g, '');
                                })
                                .filter(Boolean);
                              return texts.join(' ').slice(0, 100) || '(已編輯內容)';
                            } catch {
                              return faq.answer.slice(0, 100);
                            }
                          })() : '-'}
                        </div>
                      </td>
                      <td>
                        {faq.categoryName ? (
                          <span className="badge badge-sm badge-primary whitespace-nowrap">{faq.categoryName}</span>
                        ) : (
                          <span className="text-sm text-base-content/60">未分類</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm">{faq.ordinal}</span>
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm whitespace-nowrap ${
                            faq.published ? 'badge-success' : 'badge-ghost'
                          }`}
                        >
                          {faq.published ? '已發布' : '草稿'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">-</span>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {faq.updatedTime
                            ? new Date(faq.updatedTime).toLocaleDateString('zh-TW')
                            : new Date(faq.createdTime).toLocaleDateString('zh-TW')}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/knowledge/faq/${faq.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--eye size-4" />
                            查看
                          </Link>
                          <Link
                            to={`/knowledge/faq/${faq.id}/edit`}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--edit size-4" />
                            編輯
                          </Link>
                          <button
                            onClick={() => handleDelete(faq.id)}
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
