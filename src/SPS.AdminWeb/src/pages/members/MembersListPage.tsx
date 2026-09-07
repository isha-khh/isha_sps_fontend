import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { MemberTable } from '@/components/members/MemberTable';
import { Pagination } from '@/components/common/Pagination';
import { membersApi } from '@/lib/api/members';
import { type Member, type MemberSearchParams, MemberStatus } from '@/types/member';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

export const MembersListPage = () => {
  const notify = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  const fetchMembers = async (page: number, params: MemberSearchParams) => {
    setIsLoading(true);
    try {
      const response = await membersApi.getMembers(page, pageSize, params);
      setMembers(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(1, searchParams);
  }, [searchParams, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setSelectedMemberIds(new Set());
  };

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUpdateStatus = async (id: string, status: MemberStatus) => {
    try {
      await membersApi.updateMemberStatus(id, status);
      fetchMembers(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to update member status:', error);
      await notify.error('更新狀態失敗，請稍後再試');
    }
  };

  const handleBatchResetPassword = async () => {
    const confirmed = await confirmDialog({
      cardTitle: '批次重置密碼',
      message: `確定要重置 ${selectedMemberIds.size} 位會員的密碼嗎？\n系統將為每位會員生成新的隨機密碼。`,
      buttonConfirm: '確認重置',
      confirmStyle: 'bg-warning text-warning-content',
    });
    if (!confirmed) return;
    try {
      const result = await membersApi.batchResetPassword(Array.from(selectedMemberIds));
      await notify.success(`成功重置 ${result.success} 位會員密碼${result.failed > 0 ? `，${result.failed} 位失敗` : ''}`);
      setSelectedMemberIds(new Set());
      fetchMembers(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to batch reset password:', error);
      await notify.error('批次重置密碼失敗，請稍後再試');
    }
  };

  const handleBatchRequirePasswordChange = async (requireChange: boolean) => {
    const label = requireChange ? '要求修改密碼' : '取消要求修改密碼';
    const confirmed = await confirmDialog({
      cardTitle: `批次${label}`,
      message: `確定要將 ${selectedMemberIds.size} 位會員設為「${requireChange ? '下次登入需修改密碼' : '不需修改密碼'}」嗎？`,
      buttonConfirm: '確認',
      confirmStyle: requireChange ? 'bg-warning text-warning-content' : 'bg-info text-info-content',
    });
    if (!confirmed) return;
    try {
      const result = await membersApi.batchRequirePasswordChange(Array.from(selectedMemberIds), requireChange);
      await notify.success(`成功更新 ${result.success} 位會員${result.failed > 0 ? `，${result.failed} 位失敗` : ''}`);
      setSelectedMemberIds(new Set());
      fetchMembers(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to batch require password change:', error);
      await notify.error('批次操作失敗，請稍後再試');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ids = Array.from(selectedMemberIds);
      await membersApi.exportToExcel(ids, ids.length === 0 ? searchParams : undefined);
    } catch {
      await notify.error('匯出失敗，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchEmailVerification = async (isVerified: boolean) => {
    const label = isVerified ? '已驗證' : '未驗證';
    const confirmed = await confirmDialog({
      cardTitle: `批次設定信箱${label}`,
      message: `確定要將 ${selectedMemberIds.size} 位會員的信箱設為${label}嗎？`,
      buttonConfirm: '確認',
      confirmStyle: isVerified ? 'bg-success text-success-content' : 'bg-warning text-warning-content',
    });
    if (!confirmed) return;
    try {
      const result = await membersApi.batchUpdateEmailVerification(Array.from(selectedMemberIds), isVerified);
      await notify.success(`成功更新 ${result.success} 位會員信箱狀態${result.failed > 0 ? `，${result.failed} 位失敗` : ''}`);
      setSelectedMemberIds(new Set());
      fetchMembers(currentPage, searchParams);
    } catch (error) {
      console.error('Failed to batch update email verification:', error);
      await notify.error('批次操作失敗，請稍後再試');
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="會員管理" items={[{ label: '會員管理', active: true }]} />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* 搜尋和篩選 */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* 搜尋框 */}
              <div className="flex gap-2 flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="搜尋會員姓名、Email、公司名稱..."
                  className="input input-bordered flex-1"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <button onClick={handleSearch} className="btn btn-primary">
                  <span className="iconify lucide--search size-5" />
                  搜尋
                </button>
              </div>

              {/* 統計數字 */}
              <div className="badge badge-lg badge-primary">
                {!isLoading && `共 ${members.length} 筆`}
              </div>
            </div>

            {/* 篩選條件 */}
            <div className="flex flex-wrap gap-3">
              <select
                className="select select-bordered select-sm"
                value={searchParams.status?.toString() ?? ''}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    status: e.target.value ? (Number(e.target.value) as MemberStatus) : undefined,
                  }))
                }
              >
                <option value="">全部狀態</option>
                <option value={MemberStatus.Active}>啟用</option>
                <option value={MemberStatus.Inactive}>未啟用</option>
                <option value={MemberStatus.Suspended}>停用</option>
              </select>

              <select
                className="select select-bordered select-sm"
                value={
                  searchParams.hasCompany === undefined
                    ? ''
                    : searchParams.hasCompany
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    hasCompany:
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true',
                  }))
                }
              >
                <option value="">全部會員</option>
                <option value="true">已綁定公司</option>
                <option value="false">未綁定公司</option>
              </select>

              <select
                className="select select-bordered select-sm"
                value={
                  searchParams.isEmailVerified === undefined
                    ? ''
                    : searchParams.isEmailVerified
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    isEmailVerified:
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true',
                  }))
                }
              >
                <option value="">全部驗證狀態</option>
                <option value="true">已驗證</option>
                <option value="false">未驗證</option>
              </select>

              {/* 清除篩選 */}
              {(searchParams.status !== undefined ||
                searchParams.hasCompany !== undefined ||
                searchParams.isEmailVerified !== undefined ||
                searchParams.search) && (
                <button
                  onClick={() => {
                    setSearchParams({});
                    setSearchInput('');
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  <span className="iconify lucide--x size-4" />
                  清除篩選
                </button>
              )}
            </div>
          </div>

          {/* 批次操作列 */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-base-200 rounded-lg mb-4">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const allSelected = members.every((m) => selectedMemberIds.has(m.id));
                if (allSelected) {
                  const next = new Set(selectedMemberIds);
                  members.forEach((m) => next.delete(m.id));
                  setSelectedMemberIds(next);
                } else {
                  const next = new Set(selectedMemberIds);
                  members.forEach((m) => next.add(m.id));
                  setSelectedMemberIds(next);
                }
              }}
              disabled={members.length === 0}
            >
              <span className="iconify lucide--check-square size-4" />
              {members.length > 0 && members.every((m) => selectedMemberIds.has(m.id)) ? '取消全選' : '全選'}
            </button>
            {selectedMemberIds.size > 0 && (
              <>
                <span className="text-sm font-medium">已選取 {selectedMemberIds.size} 位會員</span>
                <div className="divider divider-horizontal mx-0" />
                {/* 密碼相關 */}
                <button className="btn btn-warning btn-sm" onClick={handleBatchResetPassword}>
                  <span className="iconify lucide--key-round size-4" />
                  批次重置密碼
                </button>
                <button className="btn btn-outline btn-warning btn-sm" onClick={() => handleBatchRequirePasswordChange(true)}>
                  <span className="iconify lucide--lock size-4" />
                  要求修改密碼
                </button>
                <button className="btn btn-outline btn-info btn-sm" onClick={() => handleBatchRequirePasswordChange(false)}>
                  <span className="iconify lucide--lock-open size-4" />
                  取消要求修改
                </button>
                <div className="divider divider-horizontal mx-0" />
                {/* 信箱驗證 */}
                <button className="btn btn-success btn-sm" onClick={() => handleBatchEmailVerification(true)}>
                  <span className="iconify lucide--mail-check size-4" />
                  設為已驗證
                </button>
                <button className="btn btn-outline btn-error btn-sm" onClick={() => handleBatchEmailVerification(false)}>
                  <span className="iconify lucide--mail-x size-4" />
                  設為未驗證
                </button>
                <div className="divider divider-horizontal mx-0" />
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMemberIds(new Set())}>
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
                title={selectedMemberIds.size > 0 ? `匯出已選取的 ${selectedMemberIds.size} 位會員` : '匯出全部（依目前篩選條件）'}
              >
                {isExporting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span className="iconify lucide--download size-4" />
                )}
                {selectedMemberIds.size > 0 ? `匯出已選取 (${selectedMemberIds.size})` : '匯出 Excel'}
              </button>
            </div>
          </div>

          {/* 會員表格 */}
          <MemberTable
            members={members}
            isLoading={isLoading}
            onUpdateStatus={handleUpdateStatus}
            selectable
            selectedIds={selectedMemberIds}
            onSelectionChange={setSelectedMemberIds}
          />

          {/* 分頁與每頁筆數 */}
          {!isLoading && members.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setSelectedMemberIds(new Set());
                  fetchMembers(page, searchParams);
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
      {ConfirmComponent}
      {notify.NotifyComponent}
    </div>
  );
};
