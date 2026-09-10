import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { ConfigProvider } from '@/contexts/config';
import { Sidebar } from '@/components/admin-layout/Sidebar';
import { Topbar } from '@/components/admin-layout/Topbar';
import { Footer } from '@/components/admin-layout/Footer';
import { Rightbar } from '@/components/admin-layout/Rightbar';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { CampaignProgressNotifications } from '@/components/mail-center/CampaignProgressNotifications';
import { useCampaignProgressPolling } from '@/hooks/useCampaignProgressPolling';
import { usePermission, Permission } from '@/hooks/usePermission';
import type { ISidebarMenuItem } from '@/components/admin-layout/SidebarMenuItem';


// 擴展選單項目介面，加入權限要求
interface MenuItemWithPermission extends ISidebarMenuItem {
  /** 需要的權限 (有任一即可顯示) */
  permissions?: bigint[];
  children?: MenuItemWithPermission[];
}

const allMenuItems: MenuItemWithPermission[] = [
  {
    id: 'dashboard',
    label: '儀表板',
    icon: 'lucide--layout-dashboard',
    url: '/dashboard',
    // 儀表板所有人都能看
  },
  {
    id: 'members',
    label: '會員管理',
    icon: 'lucide--users',
    permissions: [Permission.ManageMembers, Permission.ManageApplications],
    children: [
      { id: 'members-list', label: '會員列表', url: '/members', permissions: [Permission.ManageMembers] },
      { id: 'applications', label: '申請紀錄', url: '/applications', permissions: [Permission.ManageApplications] },
    ],
  },
  {
    id: 'companies',
    label: '公司管理',
    icon: 'lucide--building-2',
    permissions: [Permission.ManageCompanies, Permission.ManageProducts],
    children: [
      { id: 'companies-list', label: '公司列表', url: '/companies', permissions: [Permission.ManageCompanies] },
      { id: 'products-list', label: '產品管理', url: '/products', permissions: [Permission.ManageProducts] },
    ],
  },
  {
    id: 'mou',
    label: '備忘錄管理',
    icon: 'lucide--file-text',
    url: '/mou',
    permissions: [Permission.ManageMemos],
  },
  {
    id: 'demands',
    label: '需求張貼管理',
    icon: 'lucide--megaphone',
    url: '/demands',
    permissions: [Permission.ManageDemands],
  },
  {
    id: 'taxonomy',
    label: '分類管理',
    icon: 'lucide--tags',
    url: '/taxonomy/categories',
    permissions: [Permission.ManageCategories],
  },
  {
    id: 'content',
    label: '內容管理',
    icon: 'lucide--file-edit',
    permissions: [Permission.ManageNews, Permission.ManageCategories],
    children: [
      { id: 'banners', label: '橫幅管理', url: '/content/banners', permissions: [Permission.ManageNews] },
      { id: 'popup-announcements', label: '彈窗公告', url: '/content/popup-announcements', permissions: [Permission.ManageNews] },
      { id: 'files', label: '系統檔案', url: '/content/files', permissions: [Permission.ManageSettings] },
      { id: 'albums', label: '相簿管理', url: '/content/albums', permissions: [Permission.ManageNews] },
      { id: 'videos', label: '影音管理', url: '/content/videos', permissions: [Permission.ManageNews] },
    ],
  },
  {
    id: 'announcements',
    label: '公告管理',
    icon: 'lucide--megaphone',
    permissions: [Permission.ManageNews],
    children: [
      { id: 'announcement-categories', label: '公告類別', url: '/announcements/categories', permissions: [Permission.ManageCategories] },
      { id: 'announcement-list', label: '公告內容', url: '/announcements', permissions: [Permission.ManageNews] },
    ],
  },
  {
    id: 'success-cases',
    label: '成功案例',
    icon: 'lucide--trophy',
    url: '/success-cases',
    permissions: [Permission.ManageNews],
  },
  {
    id: 'knowledge',
    label: '知識庫',
    icon: 'lucide--book-open',
    permissions: [Permission.ManageRegulations, Permission.ManageQuestions],
    children: [
      { id: 'regulation-categories', label: '法規類別', url: '/knowledge/regulation-categories', permissions: [Permission.ManageCategories] },
      { id: 'regulations', label: '法條內文', url: '/knowledge/regulations', permissions: [Permission.ManageRegulations] },
      { id: 'faq-categories', label: '問題類別', url: '/knowledge/faq-categories', permissions: [Permission.ManageCategories] },
      { id: 'faq', label: '問題回覆', url: '/knowledge/faq', permissions: [Permission.ManageQuestions] },
    ],
  },
  {
    id: 'analytics',
    label: '分析報表',
    icon: 'lucide--bar-chart-2',
    permissions: [Permission.ViewAnalytics],
    children: [
      { id: 'analytics-overview', label: '報表總覽', url: '/analytics', permissions: [Permission.ViewAnalytics] },
      { id: 'analytics-traffic', label: '流量分析', url: '/analytics/traffic', permissions: [Permission.ViewAnalytics] },
      { id: 'analytics-business', label: '業務分析', url: '/analytics/business', permissions: [Permission.ViewAnalytics] },
      { id: 'analytics-content', label: '內容分析', url: '/analytics/content', permissions: [Permission.ViewAnalytics] },
      { id: 'analytics-system', label: '系統分析', url: '/analytics/system', permissions: [Permission.ViewAnalytics] },
    ],
  },
  {
    id: 'mail-center',
    label: '郵件中心',
    icon: 'lucide--mail',
    permissions: [Permission.SendBulkEmail, Permission.ManageMailLogs, Permission.ManageEmailTemplates, Permission.ManageSettings],
    children: [
      { id: 'mail-compose', label: '發送郵件', url: '/mail-center/compose', permissions: [Permission.SendBulkEmail] },
      { id: 'mail-campaigns', label: '郵件活動', url: '/mail-center/campaigns', permissions: [Permission.SendBulkEmail] },
      { id: 'mail-logs', label: '寄信紀錄', url: '/mail-center/logs', permissions: [Permission.ManageMailLogs] },
      { id: 'mail-bounces', label: '退信管理', url: '/mail-center/bounces', permissions: [Permission.ManageMailLogs] },
      { id: 'mail-templates', label: '信件範本', url: '/mail-center/templates', permissions: [Permission.ManageEmailTemplates, Permission.ManageSettings] },
    ],
  },
  {
    id: 'system',
    label: '系統管理',
    icon: 'lucide--settings',
    permissions: [Permission.ManageSettings, Permission.ManageUsers, Permission.ManageRoles],
    children: [
      { id: 'system-config', label: '系統配置', url: '/system/config', permissions: [Permission.ManageSettings] },
      { id: 'security', label: '安全設置', url: '/system/security', permissions: [Permission.ManageSettings] },
      { id: 'roles', label: '角色管理', url: '/system/roles', permissions: [Permission.ManageRoles] },
      { id: 'accounts', label: '帳號管理', url: '/system/accounts', permissions: [Permission.ManageUsers] },
      { id: 'action-logs', label: '操作記錄', url: '/system/action-logs', permissions: [Permission.ManageSettings] },
      { id: 'system-info', label: '系統資訊', url: '/system/info', permissions: [Permission.ManageSettings] },
    ],
  },
];

/**
 * 根據權限過濾選單項目
 */
function filterMenuByPermissions(
  items: MenuItemWithPermission[],
  hasAnyPermission: (permissions: bigint[]) => boolean,
  isSuperAdmin: boolean
): ISidebarMenuItem[] {
  // 超級管理員看到所有選單
  if (isSuperAdmin) {
    return items;
  }

  return items
    .filter((item) => {
      // 沒有權限要求的項目，所有人都能看
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      // 有任一權限即可
      return hasAnyPermission(item.permissions);
    })
    .map((item) => {
      // 遞迴過濾子選單
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, hasAnyPermission, isSuperAdmin);
        // 如果子選單全部被過濾掉，則隱藏父選單
        if (filteredChildren.length === 0) {
          return null;
        }
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item): item is ISidebarMenuItem => item !== null);
}

export const AdminLayout = () => {
  const { hasAny, isSuperAdmin } = usePermission();

  // 全域輪詢追蹤中的群發郵件進度
  useCampaignProgressPolling();

  // 根據使用者權限過濾選單
  const filteredMenuItems = useMemo(() => {
    return filterMenuByPermissions(allMenuItems, hasAny, isSuperAdmin());
  }, [hasAny, isSuperAdmin]);

  return (
    <ConfigProvider>
      <div className="drawer drawer-end lg:drawer-open">
        <input id="layout-rightbar-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col">
          <div className="flex min-h-screen">
            <Sidebar menuItems={filteredMenuItems} />

            <div className="flex min-h-screen grow flex-col">
              <Topbar />

              <main className="grow p-4 md:p-6">
                <Outlet />
              </main>

              <Footer />
            </div>
          </div>
        </div>
        <Rightbar />
      </div>

      {/* 全局聊天泡泡 */}
      <ChatBubble />

      {/* 全域群發郵件進度通知 */}
      <CampaignProgressNotifications />
    </ConfigProvider>
  );
};
