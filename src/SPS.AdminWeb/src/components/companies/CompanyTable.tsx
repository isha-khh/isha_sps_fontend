import type { Company } from '@/types/company';
import { CompanyTypeBadge, CompanyLevelBadge, CompanyStatusBadge } from './CompanyBadges';
import { DataTable, formatCurrency } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';

interface CompanyTableProps {
  companies: Company[];
  isLoading?: boolean;
  onUpdateStatus?: (id: string, status: number) => void;
  onDeleteAllData?: (company: Company) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export const CompanyTable = ({
  companies,
  isLoading,
  onUpdateStatus,
  onDeleteAllData,
  selectable,
  selectedIds,
  onSelectionChange,
}: CompanyTableProps) => {
  const allSelected = companies.length > 0 && companies.every((c) => selectedIds?.has(c.id));
  const someSelected = companies.some((c) => selectedIds?.has(c.id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      companies.forEach((c) => next.delete(c.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      companies.forEach((c) => next.add(c.id));
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

  const columns: Column<Company>[] = [
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
            render: (company: Company) => (
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selectedIds?.has(company.id) ?? false}
                onChange={() => handleSelectOne(company.id)}
              />
            ),
          } as Column<Company>,
        ]
      : []),
    {
      key: 'number',
      title: '公司編號',
      className: 'font-mono text-sm',
    },
    {
      key: 'name',
      title: '公司名稱',
      render: (company) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-semibold">{company.name}</div>
            {company.englishName && (
              <div className="text-xs text-base-content/60">{company.englishName}</div>
            )}
          </div>
          {company.isVerified && (
            <span
              className="iconify lucide--badge-check size-5 text-success"
              title="已驗證"
            />
          )}
        </div>
      ),
    },
    {
      key: 'type',
      title: '類型',
      render: (company) => <CompanyTypeBadge type={company.type} />,
    },
    {
      key: 'level',
      title: '級別',
      render: (company) => <CompanyLevelBadge level={company.level} />,
    },
    {
      key: 'employees',
      title: '員工數',
      render: (company) => company.employees?.toLocaleString() || '-',
    },
    {
      key: 'revenue',
      title: '年營收',
      render: (company) => formatCurrency(company.revenue),
    },
    {
      key: 'status',
      title: '狀態',
      render: (company) => <CompanyStatusBadge status={company.status} />,
    },
  ];

  return (
    <DataTable
      data={companies}
      columns={columns}
      keyField="id"
      isLoading={isLoading}
      emptyIcon="lucide--building-2"
      emptyMessage="沒有找到公司資料"
      primaryActions={[
        {
          label: '',
          icon: 'lucide--eye',
          to: (company) => `/companies/${company.id}`,
        },
        {
          label: '',
          icon: 'lucide--edit',
          to: (company) => `/companies/${company.id}/edit`,
          className: 'text-info',
        },
      ]}
      dropdownActions={[
        ...(onUpdateStatus
          ? [
              {
                label: '啟用',
                icon: 'lucide--check-circle',
                onClick: (company: Company) => onUpdateStatus(company.id, 0),
                show: (company: Company) => company.status !== 0,
              },
              {
                label: '停用',
                icon: 'lucide--ban',
                onClick: (company: Company) => onUpdateStatus(company.id, 1),
                show: (company: Company) => company.status !== 1,
              },
            ]
          : []),
        ...(onDeleteAllData
          ? [
              {
                label: '刪除所有資料',
                icon: 'lucide--trash-2',
                onClick: (company: Company) => onDeleteAllData(company),
                className: 'text-error',
                divider: true,
              },
            ]
          : []),
      ]}
    />
  );
};
