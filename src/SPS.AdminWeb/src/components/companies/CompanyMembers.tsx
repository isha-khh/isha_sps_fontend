import { useEffect, useState, useCallback } from 'react';
import { MemberTable } from '@/components/members/MemberTable';
import { Pagination } from '@/components/common/Pagination';
import { membersApi } from '@/lib/api/members';
import { type Member, MemberStatus, type MemberPosition } from '@/types/member';
import { useNotify } from '@/hooks/useNotify';

interface CompanyMembersProps {
  companyId: string;
}

export const CompanyMembers = ({ companyId }: CompanyMembersProps) => {
  const notify = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchMembers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await membersApi.getMembersByCompanyId(companyId, page, pageSize);
      setMembers(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch company members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchMembers(1);
    }
  }, [companyId, fetchMembers]);

  const handleUpdateStatus = async (id: string, status: MemberStatus) => {
    try {
      await membersApi.updateMemberStatus(id, status);
      await fetchMembers(currentPage);
    } catch (error) {
      console.error('Failed to update member status:', error);
      await notify.error('更新狀態失敗，請稍後再試');
    }
  };

  const handleUpdateMemberPosition = async (id: string, memberPosition: MemberPosition) => {
    try {
      await membersApi.updateMemberPosition(id, memberPosition);
      await fetchMembers(currentPage);
    } catch (error) {
      console.error('Failed to update member position:', error);
      await notify.error('更新角色失敗，請稍後再試');
    }
  };

  return (
    <div>
      {notify.NotifyComponent}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="iconify lucide--users size-5" />
          公司成員
          <span className="badge badge-sm">{members.length}</span>
        </h3>
      </div>

      <MemberTable
        members={members}
        isLoading={isLoading}
        onUpdateStatus={handleUpdateStatus}
        onUpdateMemberPosition={handleUpdateMemberPosition}
      />

      {!isLoading && members.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={fetchMembers}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};
