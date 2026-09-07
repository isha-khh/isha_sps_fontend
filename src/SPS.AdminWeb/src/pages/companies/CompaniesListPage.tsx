import  { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { CompanyTable } from '@/components/companies/CompanyTable';
import { Pagination } from '@/components/common/Pagination';
import { ListToolbar } from '@/components/common/ListToolbar';
import { companiesApi } from '@/lib/api/companies';
import { type Company, CompanyLevel, type CompanySearchParams, type CompanyType, Status } from '@/types/company';
import { useConfirm } from '@/hooks/useConfirm';
import { useEditDialog } from '@/hooks/useEditDialog';
import { usePermission, Permission } from '@/hooks/usePermission';
import { useNotify } from '@/hooks/useNotify';

export const CompaniesListPage = () => {
  const notify = useNotify();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<CompanySearchParams>({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  const { confirmDialog, ConfirmComponent } = useConfirm();
  const { editDialog, EditComponent } = useEditDialog<{ companyName: string }>();
  const { isSuperAdmin, has: hasPerm } = usePermission();
  const navigate = useNavigate();
  const canBulkSend = hasPerm(Permission.SendBulkEmail);

  const fetchCompanies = async (page: number, params: CompanySearchParams) => {
    setIsLoading(true);
    try {
      const response = await companiesApi.getCompanies(page, pageSize, params);
      setCompanies(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCompanies(1, searchParams);
  }, [searchParams, pageSize]);

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ids = Array.from(selectedCompanyIds);
      await companiesApi.exportToExcel(ids, ids.length === 0 ? searchParams : undefined);
    } catch {
      await notify.error('匯出失敗，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setSelectedCompanyIds(new Set());
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await companiesApi.updateCompanyStatus(id, status as Status);
      await fetchCompanies(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to update company status:', error);
      await notify.error('更新狀態失敗，請稍後再試');
    }
  };

  const handleBatchUpdateStatus = async (status: number) => {
    const label = status === Status.Active ? '啟用' : '停用';
    const confirmed = await confirmDialog({
      cardTitle: `批次${label}公司`,
      message: `確定要將 ${selectedCompanyIds.size} 間公司設為「${label}」嗎？`,
      buttonConfirm: '確認',
      confirmStyle: status === Status.Active ? 'bg-success text-success-content' : 'bg-warning text-warning-content',
    });
    if (!confirmed) return;
    try {
      const result = await companiesApi.batchUpdateStatus(Array.from(selectedCompanyIds), status);
      await notify.success(`成功${label} ${result.success} 間公司${result.failed > 0 ? `，${result.failed} 間失敗` : ''}`);
      setSelectedCompanyIds(new Set());
      await fetchCompanies(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to batch update status:', error);
      await notify.error(`批次${label}失敗，請稍後再試`);
    }
  };

  const handleBatchDelete = async () => {
    const confirmed = await confirmDialog({
      cardTitle: '批次刪除公司',
      message:
        `確定要刪除 ${selectedCompanyIds.size} 間公司嗎？\n\n` +
        `此操作將永久刪除選取的公司資料。\n` +
        `此操作無法復原！`,
      buttonConfirm: '確認刪除',
      confirmStyle: 'bg-error',
      size: 'md',
    });
    if (!confirmed) return;
    try {
      const result = await companiesApi.batchDelete(Array.from(selectedCompanyIds));
      await notify.success(`成功刪除 ${result.success} 間公司${result.failed > 0 ? `，${result.failed} 間失敗` : ''}`);
      setSelectedCompanyIds(new Set());
      await fetchCompanies(currentPage, searchParams);
    } catch (error: any) {
      console.error('Failed to batch delete:', error);
      const status = error?.response?.status;
      if (status === 403) {
        await notify.error('權限不足：僅限系統管理員執行此操作');
      } else {
        await notify.error('批次刪除失敗，請稍後再試');
      }
    }
  };

  const handleDeleteAllData = async (company: Company) => {
    // 第一步：useConfirm 警告確認
    const confirmed = await confirmDialog({
      cardTitle: '刪除公司所有資料',
      message:
        `確定要刪除公司「${company.name}」的所有資料嗎？\n\n` +
        `此操作將永久刪除該公司的所有關聯資料：\n` +
        `• 產品、需求\n` +
        `• 會員、申請紀錄\n` +
        `• 聊天記錄、評分\n` +
        `• 圖片、檔案\n\n` +
        `此操作無法復原！`,
      buttonConfirm: '繼續刪除',
      confirmStyle: 'bg-error',
      buttonCancel: '取消',
      size: 'md',
    });
    if (!confirmed) return;

    // 第二步：useEditDialog 輸入公司名稱二次確認
    const result = await editDialog({
      cardTitle: '二次確認：輸入公司名稱',
      buttonConfirm: undefined,
      buttonCancel: undefined,
      escapeToClose: true,
      renderForm: ({ onConfirm, onCancel }) => {
        let inputValue = '';
        return (
          <div className="space-y-4">
            <p className="text-sm text-base-content/70">
              請輸入公司名稱 <strong className="text-error">「{company.name}」</strong> 以確認刪除：
            </p>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={company.name}
              onChange={(e) => { inputValue = e.target.value; }}
              autoFocus
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={() => {
                  if (inputValue === company.name) {
                    onConfirm({ companyName: inputValue });
                  } else {
                    onCancel();
                  }
                }}
              >
                確認刪除
              </button>
            </div>
          </div>
        );
      },
    });

    if (!result || result.companyName !== company.name) {
      if (result !== null) {
        await confirmDialog({
          cardTitle: '已取消',
          message: '輸入的公司名稱不符，已取消刪除。',
          buttonConfirm: '確定',
          confirmStyle: 'bg-primary',
          buttonCancel: undefined,
          size: 'sm',
        });
      }
      return;
    }

    // 第三步：執行刪除
    try {
      await companiesApi.deleteAllCompanyData(company.id);
      await confirmDialog({
        cardTitle: '刪除成功',
        message: `公司「${company.name}」的所有資料已刪除。`,
        buttonConfirm: '確定',
        confirmStyle: 'bg-success',
        buttonCancel: undefined,
        size: 'sm',
      });
      await fetchCompanies(currentPage, searchParams);
    } catch (error: any) {
      console.error('Failed to delete all company data:', error);
      const status = error?.response?.status;
      let message: string;
      if (status === 403) {
        message = '權限不足：僅限超級管理員執行此操作';
      } else if (status === 401) {
        message = '未授權：請重新登入後再試';
      } else {
        message = error?.response?.data?.error || error?.message || '刪除失敗，請稍後再試';
      }
      await confirmDialog({
        cardTitle: '刪除失敗',
        message,
        buttonConfirm: '確定',
        confirmStyle: 'bg-error',
        buttonCancel: undefined,
        size: 'sm',
      });
    }
  };

  const hasFilters =
    searchParams.type !== undefined ||
    searchParams.level !== undefined ||
    searchParams.status !== undefined ||
    searchParams.isVerified !== undefined ||
    searchParams.search;

  const handleClearFilter = () => {
    setSearchParams({});
    setSearchInput('');
  };

  return (
    <div className="space-y-6">
      {ConfirmComponent}
      {EditComponent}
      {notify.NotifyComponent}
      <PageTitle title="公司管理" items={[{ label: '公司管理', active: true }]} />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ListToolbar
            searchPlaceholder="搜尋公司名稱、英文名稱、公司編號..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={handleSearch}
            totalCount={companies.length}
            isLoading={isLoading}
            actions={
              <Link to="/companies/create" className="btn btn-success">
                <span className="iconify lucide--plus size-5" />
                新增公司
              </Link>
            }
            showClearFilter={!!hasFilters}
            onClearFilter={handleClearFilter}
            filters={
              <>
                <select
                  className="select select-bordered select-sm"
                  value={searchParams.type !== undefined ? searchParams.type : ''}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      type: e.target.value === '' ? undefined : (Number(e.target.value) as CompanyType),
                    }))
                  }
                >
                  <option value="">全部類型</option>
                  <option value="1">供給端</option>
                  <option value="2">需求端</option>
                  <option value="3">供需雙方</option>
                </select>

                <select
                  className="select select-bordered select-sm"
                  value={searchParams.level !== undefined ? searchParams.level : ''}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      level: e.target.value === '' ? undefined : (Number(e.target.value) as CompanyLevel),
                    }))
                  }
                >
                  <option value="">全部級別</option>
                  <option value="0">普通</option>
                  <option value="1">銀牌</option>
                  <option value="2">金牌</option>
                  <option value="3">鑽石</option>
                </select>

                <select
                  className="select select-bordered select-sm"
                  value={searchParams.status !== undefined ? searchParams.status : ''}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      status: e.target.value === '' ? undefined : (Number(e.target.value) as Status),
                    }))
                  }
                >
                  <option value="">全部狀態</option>
                  <option value="0">啟用</option>
                  <option value="1">停用</option>
                </select>

                <select
                  className="select select-bordered select-sm"
                  value={
                    searchParams.isVerified === undefined
                      ? ''
                      : searchParams.isVerified
                      ? 'true'
                      : 'false'
                  }
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      isVerified: e.target.value === '' ? undefined : e.target.value === 'true',
                    }))
                  }
                >
                  <option value="">全部驗證狀態</option>
                  <option value="true">已驗證</option>
                  <option value="false">未驗證</option>
                </select>
              </>
            }
          />

          {/* 批次操作列 */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-base-200 rounded-lg mb-4">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const allSelected = companies.every((c) => selectedCompanyIds.has(c.id));
                if (allSelected) {
                  const next = new Set(selectedCompanyIds);
                  companies.forEach((c) => next.delete(c.id));
                  setSelectedCompanyIds(next);
                } else {
                  const next = new Set(selectedCompanyIds);
                  companies.forEach((c) => next.add(c.id));
                  setSelectedCompanyIds(next);
                }
              }}
              disabled={companies.length === 0}
            >
              <span className="iconify lucide--check-square size-4" />
              {companies.length > 0 && companies.every((c) => selectedCompanyIds.has(c.id)) ? '取消全選' : '全選'}
            </button>
            {selectedCompanyIds.size > 0 && (
              <>
                <span className="text-sm font-medium">已選取 {selectedCompanyIds.size} 間公司</span>
                <div className="divider divider-horizontal mx-0" />
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleBatchUpdateStatus(Status.Active)}
                >
                  <span className="iconify lucide--check-circle size-4" />
                  批次啟用
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => handleBatchUpdateStatus(Status.Inactive)}
                >
                  <span className="iconify lucide--ban size-4" />
                  批次停用
                </button>
                {canBulkSend && (
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() =>
                      navigate(`/mail-center/compose?companyIds=${Array.from(selectedCompanyIds).join(',')}`)
                    }
                    title="寄信給所選公司底下的會員"
                  >
                    <span className="iconify lucide--mail size-4" />
                    寄信給所選公司會員
                  </button>
                )}
                {isSuperAdmin() && (
                  <>
                    <div className="divider divider-horizontal mx-0" />
                    <button
                      className="btn btn-error btn-sm"
                      onClick={handleBatchDelete}
                    >
                      <span className="iconify lucide--trash-2 size-4" />
                      批次刪除
                    </button>
                  </>
                )}
                <div className="divider divider-horizontal mx-0" />
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCompanyIds(new Set())}>
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
                title={selectedCompanyIds.size > 0 ? `匯出已選取的 ${selectedCompanyIds.size} 間公司` : '匯出全部（依目前篩選條件）'}
              >
                {isExporting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span className="iconify lucide--download size-4" />
                )}
                {selectedCompanyIds.size > 0 ? `匯出已選取 (${selectedCompanyIds.size})` : '匯出 Excel'}
              </button>
            </div>
          </div>

          {/* 公司表格 */}
          <CompanyTable
            companies={companies}
            isLoading={isLoading}
            onUpdateStatus={handleUpdateStatus}
            onDeleteAllData={handleDeleteAllData}
            selectable
            selectedIds={selectedCompanyIds}
            onSelectionChange={setSelectedCompanyIds}
          />

          {/* 分頁與每頁筆數 */}
          {!isLoading && companies.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setSelectedCompanyIds(new Set());
                  fetchCompanies(page, searchParams);
                }}
                isLoading={isLoading}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/70">每頁顯示</span>
                <select
                  className="select select-bordered select-sm w-20"
                  value={[10, 20, 50, 100].includes(pageSize) ? pageSize : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      handlePageSizeChange(Number(val));
                    }
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  {![10, 20, 50, 100].includes(pageSize) && (
                    <option value="custom">{pageSize}</option>
                  )}
                </select>
                <span className="text-sm text-base-content/70">或</span>
                <input
                  type="number"
                  className="input input-bordered input-sm w-20"
                  min={1}
                  max={500}
                  placeholder="筆數"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val >= 1 && val <= 500) {
                        handlePageSizeChange(val);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= 500) {
                      handlePageSizeChange(val);
                    }
                  }}
                />
                <span className="text-sm text-base-content/70">筆</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
