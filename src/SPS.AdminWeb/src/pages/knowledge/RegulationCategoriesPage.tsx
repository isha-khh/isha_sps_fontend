import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { categoriesApi } from '@/lib/api/category';
import { useConfirm } from '@/hooks/useConfirm';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// 法規分類的 type 值 (對應後端 CategoryType.Regulations = 4)
const REGULATIONS_CATEGORY_TYPE = 4;

interface CategoryFormData {
  name: string;
  remark: string;
  ordinal: number;
  published: boolean;
}

export const RegulationCategoriesPage = () => {
  const notify = useNotify();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    remark: '',
    ordinal: 0,
    published: true,
  });

  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.getCategoriesByType(REGULATIONS_CATEGORY_TYPE);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: CategoryResponse) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        remark: category.remark || '',
        ordinal: category.ordinal,
        published: category.published,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', remark: '', ordinal: 0, published: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', remark: '', ordinal: 0, published: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入類別名稱');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const updateRequest: UpdateCategoryRequest = {
          name: formData.name,
          remark: formData.remark,
          ordinal: formData.ordinal,
          published: formData.published,
        };
        await categoriesApi.updateCategory(editingCategory.id, updateRequest);
      } else {
        const createRequest: CreateCategoryRequest = {
          type: REGULATIONS_CATEGORY_TYPE,
          name: formData.name,
          remark: formData.remark,
          ordinal: formData.ordinal,
          published: formData.published,
        };
        await categoriesApi.createCategory(createRequest);
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      await notify.error('儲存類別失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ cardTitle: '刪除類別', message: '確定要刪除此類別嗎？', buttonConfirm: '刪除', confirmStyle: 'bg-error' });
    if (!confirmed) return;

    try {
      await categoriesApi.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      await notify.error('刪除類別失敗');
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="法規類別"
        items={[
          { label: '知識庫', path: '/knowledge' },
          { label: '法規類別', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          共 <span className="font-semibold text-base-content">{categories.length}</span> 個類別
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success">
          <span className="iconify lucide--plus size-5" />
          新增類別
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--book-open size-16 mb-4" />
              <p>尚未建立任何法規類別</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>類別名稱</th>
                    <th>說明</th>
                    <th>排序</th>
                    <th>狀態</th>
                    <th>建立時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <div className="font-semibold">{category.name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70 max-w-md line-clamp-2">
                          {category.remark || '-'}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">{category.ordinal}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            category.published ? 'badge-success' : 'badge-ghost'
                          }`}
                        >
                          {category.published ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {new Date(category.createdTime).toLocaleDateString('zh-TW')}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--edit size-4" />
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingCategory ? '編輯類別' : '新增類別'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      類別名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：勞動法規"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">說明</span>
                  </label>
                  <textarea
                    placeholder="類別的說明..."
                    className="textarea textarea-bordered h-24"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">排序</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered"
                    value={formData.ordinal}
                    onChange={(e) => setFormData({ ...formData, ordinal: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text font-medium">啟用</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-success" disabled={isSaving}>
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <span className="iconify lucide--save size-4" />
                      {editingCategory ? '儲存' : '新增'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={handleCloseModal} />
        </div>
      )}
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
