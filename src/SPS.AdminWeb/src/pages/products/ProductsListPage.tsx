import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { DataTable, formatDateTime } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ListToolbar } from '@/components/common/ListToolbar';
import { productApi } from '@/lib/api/product';
import { useConfirm } from '@/hooks/useConfirm';
import type { ProductResponse, ProductQueryParameters } from '@/types/product';
import { useNotify } from '@/hooks/useNotify';

export const ProductsListPage = () => {
  const notify = useNotify();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<ProductQueryParameters>({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const pageSize = 20;

  const fetchProducts = async (page: number, params: ProductQueryParameters) => {
    setIsLoading(true);
    try {
      const response = await productApi.getPaged(page, pageSize, params);
      setProducts(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, searchParams);
  }, [searchParams]);

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleDelete = async (product: ProductResponse) => {
    const confirmed = await confirmDialog({
      cardTitle: '確認刪除',
      message: `確定要刪除產品「${product.name}」嗎？此操作無法復原。`,
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;
    try {
      await productApi.delete(product.id);
      fetchProducts(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to delete product:', error);
      await notify.error('刪除產品失敗，請稍後再試');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ids = Array.from(selectedProductIds);
      await productApi.exportToExcel(ids, ids.length === 0 ? searchParams : undefined);
    } catch {
      await notify.error('匯出失敗，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectAll = () => {
    const allSelected = products.length > 0 && products.every((p) => selectedProductIds.has(p.id));
    if (allSelected) {
      const next = new Set(selectedProductIds);
      products.forEach((p) => next.delete(p.id));
      setSelectedProductIds(next);
    } else {
      const next = new Set(selectedProductIds);
      products.forEach((p) => next.add(p.id));
      setSelectedProductIds(next);
    }
  };

  const handleSelectOne = (id: number) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  const hasFilters = searchParams.published !== undefined || searchParams.search;

  const handleClearFilter = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const allSelected = products.length > 0 && products.every((p) => selectedProductIds.has(p.id));
  const someSelected = products.some((p) => selectedProductIds.has(p.id));

  const columns: Column<ProductResponse>[] = [
    {
      key: '_select',
      title: (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={handleSelectAll}
        />
      ),
      className: 'w-10',
      render: (product) => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedProductIds.has(product.id)}
          onChange={() => handleSelectOne(product.id)}
        />
      ),
    },
    {
      key: 'name',
      title: '產品名稱',
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.cover?.uri ? (
            <img
              src={product.cover.uri}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg bg-base-200"
            />
          ) : (
            <div className="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center">
              <span className="iconify lucide--package size-6 text-base-content/40" />
            </div>
          )}
          <div>
            <div className="font-semibold">{product.name}</div>
            <div className="text-xs text-base-content/60">{product.number}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'modelNo',
      title: '型號',
      render: (product) => product.modelNo || '-',
    },
    {
      key: 'companyName',
      title: '所屬公司',
      render: (product) =>
        product.companyName ? (
          <div className="flex items-center gap-1">
            <span className="iconify lucide--building-2 size-4" />
            {product.companyName}
          </div>
        ) : (
          <span className="text-base-content/50">-</span>
        ),
    },
    {
      key: 'published',
      title: '發布狀態',
      render: (product) =>
        product.published ? (
          <span className="badge badge-success badge-sm">已發布</span>
        ) : (
          <span className="badge badge-ghost badge-sm">草稿</span>
        ),
    },
    {
      key: 'createdTime',
      title: '建立時間',
      className: 'text-sm text-base-content/70',
      render: (product) => formatDateTime(product.createdTime),
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="產品管理"
        items={[{ label: '產品管理', active: true }]}
      />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ListToolbar
            searchPlaceholder="搜尋產品名稱、型號..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={handleSearch}
            totalCount={products.length}
            isLoading={isLoading}
            actions={
              <Link to="/products/create" className="btn btn-success">
                <span className="iconify lucide--plus size-5" />
                新增產品
              </Link>
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

          {/* 批次操作列 */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-base-200 rounded-lg mb-4">
            <button
              className="btn btn-outline btn-sm"
              onClick={handleSelectAll}
              disabled={products.length === 0}
            >
              <span className="iconify lucide--check-square size-4" />
              {allSelected ? '取消全選' : '全選'}
            </button>
            {selectedProductIds.size > 0 && (
              <>
                <span className="text-sm font-medium">已選取 {selectedProductIds.size} 個產品</span>
                <div className="divider divider-horizontal mx-0" />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedProductIds(new Set())}
                >
                  <span className="iconify lucide--x size-4" />
                  取消選取
                </button>
              </>
            )}
            <div className="ml-auto">
              <button
                className="btn btn-outline btn-info btn-sm"
                onClick={handleExport}
                disabled={isExporting || isLoading}
                title={selectedProductIds.size > 0 ? `匯出已選取的 ${selectedProductIds.size} 個產品` : '匯出全部（依目前篩選條件）'}
              >
                {isExporting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span className="iconify lucide--download size-4" />
                )}
                {selectedProductIds.size > 0 ? `匯出已選取 (${selectedProductIds.size})` : '匯出 Excel'}
              </button>
            </div>
          </div>

          <DataTable
            data={products}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyIcon="lucide--package"
            emptyMessage="沒有找到產品資料"
            primaryActions={[
              {
                label: '查看',
                icon: 'lucide--eye',
                to: (product) => `/products/${product.id}`,
              },
            ]}
            dropdownActions={[
              {
                label: '編輯',
                icon: 'lucide--edit',
                to: (product) => `/products/${product.id}/edit`,
              },
              {
                label: '刪除',
                icon: 'lucide--trash-2',
                className: 'text-error',
                onClick: handleDelete,
                divider: true,
              },
            ]}
            confirmDialog={confirmDialog}
          />

          {!isLoading && products.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setSelectedProductIds(new Set());
                  fetchProducts(page, searchParams);
                }}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
      {ConfirmComponent}
      {notify.NotifyComponent}
    </div>
  );
};
