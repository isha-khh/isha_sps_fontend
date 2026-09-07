import { useState } from 'react';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

interface MockItem {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export default function DropdownTestPage() {
  const notify = useNotify();
  const [selectedApproach, setSelectedApproach] = useState<string>('default');
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const mockData: MockItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `項目 ${i + 1}`,
    status: i % 2 === 0 ? '啟用' : '停用',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  // DataTable 欄位定義
  const columns: Column<MockItem>[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: '名稱' },
    {
      key: 'status',
      title: '狀態',
      render: (item) => (
        <span className={`badge ${item.status === '啟用' ? 'badge-success' : 'badge-warning'}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (item) => formatDate(item.createdAt),
    },
  ];

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dropdown 測試頁面</h1>
        <select
          className="select select-bordered"
          value={selectedApproach}
          onChange={(e) => setSelectedApproach(e.target.value)}
        >
          <option value="default">預設 (dropdown-end)</option>
          <option value="bottom-center">dropdown-bottom dropdown-center</option>
          <option value="bottom-end">dropdown-bottom dropdown-end</option>
          <option value="top-end">dropdown-top dropdown-end</option>
          <option value="left">dropdown-left</option>
          <option value="hover">dropdown-hover</option>
        </select>
      </div>

      <div className="alert alert-info">
        <span className="iconify lucide--info size-5" />
        <div>
          <p><strong>問題：</strong><code>overflow-x-auto</code> 會裁切 dropdown 內容</p>
          <p><strong>測試：</strong>選擇不同的 dropdown 方式，觀察最後一行的選單是否被裁切</p>
        </div>
      </div>

      {/* 方案 1: 原始問題重現 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">方案 1: 原始問題 (overflow-x-auto 無 padding)</h2>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>
                      <DropdownMenu approach={selectedApproach} itemId={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 方案 2: 加底部 padding */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">方案 2: 加底部 padding (pb-40)</h2>
          <div className="overflow-x-auto pb-40 border border-base-300 rounded-lg">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>
                      <DropdownMenu approach={selectedApproach} itemId={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 方案 3: 不用 overflow-x-auto */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">方案 3: 移除 overflow-x-auto</h2>
          <div className="border border-base-300 rounded-lg">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>
                      <DropdownMenu approach={selectedApproach} itemId={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 方案 4: 使用 details/summary (原生 HTML) */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">方案 4: 使用 details/summary (DaisyUI dropdown 底層)</h2>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>
                      <details className="dropdown dropdown-end">
                        <summary className="btn btn-ghost btn-sm">
                          <span className="iconify lucide--more-vertical size-4" />
                        </summary>
                        <ul className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-40">
                          <li><button>編輯</button></li>
                          <li><button>刪除</button></li>
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 方案 5: Fixed 定位 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">方案 5: Fixed 定位 dropdown-content</h2>
          <p className="text-sm text-base-content/70 mb-2">
            使用 CSS <code>position: fixed</code> 讓選單脫離 overflow 容器
          </p>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>
                      <FixedDropdown itemId={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 方案 6: 使用 DataTable 組件 (推薦) */}
      <div className="card bg-base-100 shadow border-2 border-primary">
        <div className="card-body">
          <h2 className="card-title text-primary">
            <span className="iconify lucide--star size-5" />
            方案 6: 使用 DataTable 組件 (推薦)
          </h2>
          <p className="text-sm text-base-content/70 mb-2">
            統一的表格組件，自動處理 loading、空狀態、操作欄
          </p>
          <div className="mockup-code mb-4 text-xs">
            <pre><code>{`<DataTable
  data={mockData}
  columns={columns}
  keyField="id"
  primaryActions={[
    { label: '查看', icon: 'lucide--eye', to: (item) => \`/items/\${item.id}\` }
  ]}
  dropdownActions={[
    { label: '編輯', icon: 'lucide--edit', to: (item) => \`/items/\${item.id}/edit\` },
    { label: '刪除', icon: 'lucide--trash-2', onClick: handleDelete, className: 'text-error', divider: true }
  ]}
/>`}</code></pre>
          </div>
          <DataTable
            data={mockData}
            columns={columns}
            keyField="id"
            emptyIcon="lucide--package"
            emptyMessage="沒有找到項目"
            confirmDialog={confirmDialog}
            primaryActions={[
              {
                label: '查看',
                icon: 'lucide--eye',
                to: (item) => `/test/item/${item.id}`,
              },
            ]}
            dropdownActions={[
              {
                label: '編輯',
                icon: 'lucide--edit',
                to: (item) => `/test/item/${item.id}/edit`,
              },
              {
                label: '切換狀態',
                icon: 'lucide--power',
                onClick: async (item) => await notify.info(`切換狀態: ${item.name}`),
              },
              {
                label: '刪除',
                icon: 'lucide--trash-2',
                onClick: async (item) => await notify.success(`已刪除: ${item.name}`),
                className: 'text-error',
                divider: true,
                confirm: (item) => `確定要刪除 ${item.name} 嗎？`,
              },
            ]}
          />
        </div>
      </div>
    </div>
    {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
}

// 通用 Dropdown 選單組件
function DropdownMenu({ approach, itemId }: { approach: string; itemId: number }) {
  const getDropdownClass = () => {
    switch (approach) {
      case 'bottom-center':
        return 'dropdown dropdown-bottom dropdown-center';
      case 'bottom-end':
        return 'dropdown dropdown-bottom dropdown-end';
      case 'top-end':
        return 'dropdown dropdown-top dropdown-end';
      case 'left':
        return 'dropdown dropdown-left';
      case 'hover':
        return 'dropdown dropdown-end dropdown-hover';
      default:
        return 'dropdown dropdown-end';
    }
  };

  return (
    <div className={getDropdownClass()}>
      <label tabIndex={0} className="btn btn-ghost btn-sm">
        <span className="iconify lucide--more-vertical size-4" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-40"
      >
        <li>
          <button>
            <span className="iconify lucide--eye size-4" />
            查看 #{itemId}
          </button>
        </li>
        <li>
          <button>
            <span className="iconify lucide--edit size-4" />
            編輯
          </button>
        </li>
        <li>
          <button className="text-error">
            <span className="iconify lucide--trash-2 size-4" />
            刪除
          </button>
        </li>
      </ul>
    </div>
  );
}

// Fixed 定位 Dropdown 組件
function FixedDropdown({ itemId }: { itemId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 160, // menu width is w-40 = 160px
      });
    }
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={handleToggle}
      >
        <span className="iconify lucide--more-vertical size-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
          {/* Fixed positioned menu */}
          <ul
            className="fixed z-50 menu p-2 shadow bg-base-100 rounded-box w-40"
            style={{ top: position.top, left: position.left }}
          >
            <li>
              <button onClick={handleClose}>
                <span className="iconify lucide--eye size-4" />
                查看 #{itemId}
              </button>
            </li>
            <li>
              <button onClick={handleClose}>
                <span className="iconify lucide--edit size-4" />
                編輯
              </button>
            </li>
            <li>
              <button onClick={handleClose} className="text-error">
                <span className="iconify lucide--trash-2 size-4" />
                刪除
              </button>
            </li>
          </ul>
        </>
      )}
    </>
  );
}
