import { type Member, MemberStatus, MemberPosition } from '@/types/member';
import { MemberStatusBadge } from './MemberStatusBadge';
import { DataTable, formatDateTime } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';

interface MemberTableProps {
  members: Member[];
  isLoading?: boolean;
  onUpdateStatus?: (id: string, status: MemberStatus) => void;
  onUpdateMemberPosition?: (id: string, memberPosition: MemberPosition) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

const memberPositionLabel = (memberPosition: MemberPosition) =>
  memberPosition === MemberPosition.Manager ? '經理' : '員工';

export const MemberTable = ({ members, isLoading, onUpdateStatus, onUpdateMemberPosition, selectable, selectedIds, onSelectionChange }: MemberTableProps) => {
  const allSelected = members.length > 0 && members.every((m) => selectedIds?.has(m.id));
  const someSelected = members.some((m) => selectedIds?.has(m.id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      // Deselect all on current page
      const next = new Set(selectedIds);
      members.forEach((m) => next.delete(m.id));
      onSelectionChange(next);
    } else {
      // Select all on current page
      const next = new Set(selectedIds);
      members.forEach((m) => next.add(m.id));
      onSelectionChange(next);
    }
  };

  const handleSelectOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const columns: Column<Member>[] = [
    // Checkbox column (conditionally prepended)
    ...(selectable
      ? [
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
            render: (member: Member) => (
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selectedIds?.has(member.id) ?? false}
                onChange={() => handleSelectOne(member.id)}
              />
            ),
          } as Column<Member>,
        ]
      : []),
    {
      key: 'name',
      title: '會員姓名',
      render: (member) => (
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-sm">{member.name.charAt(0)}</span>
            </div>
          </div>
          <div>
            <div className="font-semibold">{member.name}</div>
            {!member.isEmailVerified && (
              <div className="text-xs text-error flex items-center gap-1">
                <span className="iconify lucide--mail-x size-3" />
                未驗證
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: '電子郵件',
    },
    {
      key: 'phone',
      title: '聯絡電話',
      render: (member) => (
        <div>
          {member.mobilePhone && (
            <div className="flex items-center gap-1">
              <span className="iconify lucide--smartphone size-4" />
              {member.mobilePhone}
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-1 text-sm">
              <span className="iconify lucide--phone size-4" />
              {member.phone}
              {member.extension && ` #${member.extension}`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'companyName',
      title: '所屬公司',
      render: (member) =>
        member.companyName ? (
          <div className="flex items-center gap-1">
            <span className="iconify lucide--building-2 size-4" />
            {member.companyName}
          </div>
        ) : (
          <span className="text-base-content/50">-</span>
        ),
    },
    {
      key: 'status',
      title: '狀態',
      render: (member) => <MemberStatusBadge status={member.status} />,
    },
    {
      key: 'memberPosition',
      title: '角色',
      render: (member) => (
        <span className={`badge badge-sm ${member.memberPosition === MemberPosition.Manager ? 'badge-info' : 'badge-secondary'}`}>
          {memberPositionLabel(member.memberPosition)}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      title: '最後登入',
      className: 'text-sm text-base-content/70',
      render: (member) => formatDateTime(member.lastLoginAt),
    },
  ];

  const dropdownActions = [
    ...(onUpdateStatus
      ? [
          {
            label: '設為活躍',
            icon: 'lucide--check-circle',
            onClick: (member: Member) => onUpdateStatus(member.id, MemberStatus.Active),
            show: (member: Member) => member.status !== MemberStatus.Active,
          },
          {
            label: '停用帳號',
            icon: 'lucide--ban',
            onClick: (member: Member) => onUpdateStatus(member.id, MemberStatus.Suspended),
            show: (member: Member) => member.status !== MemberStatus.Suspended,
          },
        ]
      : []),
    ...(onUpdateMemberPosition
      ? [
          {
            label: '調整為經理',
            icon: 'lucide--arrow-left-right',
            onClick: (member: Member) => onUpdateMemberPosition(member.id, MemberPosition.Manager),
            show: (member: Member) => member.memberPosition !== MemberPosition.Manager,
          },
          {
            label: '調整為員工',
            icon: 'lucide--arrow-left-right',
            onClick: (member: Member) => onUpdateMemberPosition(member.id, MemberPosition.Employee),
            show: (member: Member) => member.memberPosition !== MemberPosition.Employee,
          },
        ]
      : []),
  ];

  return (
    <DataTable
      data={members}
      columns={columns}
      keyField="id"
      isLoading={isLoading}
      emptyIcon="lucide--users"
      emptyMessage="沒有找到會員資料"
      primaryActions={[
        {
          label: '查看',
          icon: 'lucide--eye',
          to: (member) => `/members/${member.id}`,
        },
      ]}
      dropdownActions={dropdownActions.length > 0 ? dropdownActions : undefined}
    />
  );
};
