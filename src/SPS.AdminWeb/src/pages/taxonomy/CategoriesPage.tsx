import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { TabSelector } from '@/components/common/TabSelector';
import { categoriesApi } from '@/lib/api/category';
import { useConfirm } from '@/hooks/useConfirm';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import { useNotify } from '@/hooks/useNotify';

// CategoryType 枚舉對應
const CATEGORY_TYPES = [
  { value: 0, label: '通用分類', name: 'General' },
  { value: 1, label: '公告分類', name: 'News' },
  { value: 2, label: '產品分類', name: 'Product' },
  { value: 3, label: '問答分類', name: 'Question' },
  { value: 4, label: '法規分類', name: 'Regulations' },
  { value: 5, label: '標籤分類', name: 'Tag' },
  { value: 6, label: '企業標籤分類', name: 'CompanyTag' },
  { value: 7, label: '業務屬性類別', name: 'Business' },
  { value: 8, label: '產品類別', name: 'ProductCategory' },
];

export const CategoriesPage = () => {
  const notify = useNotify();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<number>(0);

  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    remark: '',
    ordinal: 0,
    type: selectedType,
  });

  const { confirmDialog, ConfirmComponent } = useConfirm();

  useEffect(() => {
    void fetchCategories();
  }, [selectedType]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.getCategoriesByType(selectedType);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeName = (type: number) => {
    return CATEGORY_TYPES.find(t => t.value === type)?.label || `類型 ${type}`;
  };

  const handleOpenModal = (category?: CategoryResponse) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        remark: category.remark || '',
        parentId: category.parentId,
        ordinal: category.ordinal,
        type: category.type,
        published: category.published,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', remark: '', ordinal: 0, type: selectedType, published: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', remark: '', ordinal: 0, type: selectedType, published: true });
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
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
          remark: formData.remark,
          parentId: formData.parentId,
          ordinal: formData.ordinal,
          type: formData.type,
          published: formData.published,
        };
        await categoriesApi.updateCategory(editingCategory.id, updateData);
      } else {
        await categoriesApi.createCategory(formData);
      }
      handleCloseModal();
      await fetchCategories();
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
      await fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      await notify.error('刪除類別失敗');
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageTitle
        title="分類管理"
        items={[
          { label: '分類與屬性', path: '/taxonomy/business-categories' },
          { label: '分類管理', active: true },
        ]}
      />

      <TabSelector
        tabs={CATEGORY_TYPES}
        activeTab={selectedType}
        onTabChange={setSelectedType}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/60">
          <span className="font-semibold text-primary">{getTypeName(selectedType)}</span>
          {' '}共 <span className="font-semibold text-base-content">{categories.length}</span> 個類別
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
              <span className="iconify lucide--folder size-16 mb-4" />
              <p>尚未建立任何{getTypeName(selectedType)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>類別名稱</th>
                    <th>說明</th>
                    <th>上層類別</th>
                    <th>排序</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <span className="text-sm text-base-content/50">{category.id}</span>
                      </td>
                      <td>
                        <div className="font-semibold">{category.name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-base-content/70 max-w-md line-clamp-2">
                          {category.remark || '-'}
                        </div>
                      </td>
                      <td>
                        {category.parentName ? (
                          <span className="badge badge-outline">{category.parentName}</span>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm">{category.ordinal}</span>
                      </td>
                      <td>
                        <span className={`badge ${category.published ? 'badge-success' : 'badge-ghost'}`}>
                          {category.published ? '啟用' : '停用'}
                        </span>
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
                {/* 類型選擇 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      類型 <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
                  >
                    {CATEGORY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.value} - {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      類別名稱 <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：系統公告"
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
                    placeholder="類別的詳細說明..."
                    className="textarea textarea-bordered h-24"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">上層類別</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.parentId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        parentId: value === '' ? undefined : Number(value),
                      });
                    }}
                  >
                    <option value="">無上層類別</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">排序順序</span>
                    <span className="label-text-alt">數字越大越前面</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered"
                    value={formData.ordinal}
                    onChange={(e) =>
                      setFormData({ ...formData, ordinal: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text font-medium">啟用</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.published ?? true}
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