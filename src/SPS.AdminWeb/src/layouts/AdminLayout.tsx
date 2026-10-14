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

/**
 * 後台選單：內容相關的項目照前台主選單（`SPS.Web/src/components/layout/Headers.tsx`）的名稱與階層排列——
 * 前台選單叫什麼、後台就叫什麼：公告事項、服務專區（技術工具、人才培育、產業輔導、補助資源）、推廣專區、我要媒合、常見問題、關於我們。
 * 前台改選單名稱時，這裡要一起改。其餘（會員、系統、報表、郵件…）是後台自己的功能，維持原樣。
 */
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
    permissions: [Permission.ViewMembers, Permission.ViewApplications],
    children: [
      { id: 'members-list', label: '會員列表', url: '/members', permissions: [Permission.ViewMembers] },
      { id: 'applications', label: '申請紀錄', url: '/applications', permissions: [Permission.ViewApplications] },
    ],
  },
  // ───── 前台主選單：關於我們 ─────
  {
    id: 'about',
    label: '關於我們',
    icon: 'lucide--info',
    url: '/content/about',
    permissions: [Permission.ManageSiteContent],
  },
  // ───── 前台主選單：公告事項 ─────
  {
    id: 'announcements',
    label: '公告事項',
    icon: 'lucide--megaphone',
    permissions: [Permission.ManageNews],
    children: [
      { id: 'announcement-categories', label: '公告類別', url: '/announcements/categories', permissions: [Permission.ManageCategories] },
      { id: 'announcement-tags', label: '公告標籤', url: '/announcements/tags', permissions: [Permission.ManageNews] },
      { id: 'announcement-list', label: '公告內容', url: '/announcements', permissions: [Permission.ManageNews] },
    ],
  },
  // ───── 前台主選單：服務專區（技術工具、人才培育、產業輔導、補助資源）─────
  {
    id: 'service-zone',
    label: '服務專區',
    icon: 'lucide--briefcase',
    permissions: [Permission.ManageNews],
    children: [
      {
        id: 'serve-items',
        label: '技術工具',
        permissions: [Permission.ManageNews],
        children: [
          { id: 'serve-categories', label: '技術工具分類', url: '/serve-items/categories', permissions: [Permission.ManageCategories] },
          { id: 'serve-item-list', label: '技術工具內容', url: '/serve-items', permissions: [Permission.ManageNews] },
        ],
      },
      {
        id: 'talent-courses',
        label: '人才培育',
        permissions: [Permission.ManageNews],
        children: [{ id: 'talent-course-list', label: '課程內容', url: '/talent-courses', permissions: [Permission.ManageNews] }],
      },
      {
        id: 'tutoring-items',
        label: '產業輔導',
        permissions: [Permission.ManageNews],
        children: [
          { id: 'tutoring-categories', label: '產業別', url: '/tutoring-items/categories', permissions: [Permission.ManageCategories] },
          { id: 'tutoring-item-list', label: '輔導內容', url: '/tutoring-items', permissions: [Permission.ManageNews] },
        ],
      },
      {
        id: 'support-zone',
        label: '補助資源',
        permissions: [Permission.ManageNews],
        children: [
          { id: 'support-notice-list', label: '本計畫補助', url: '/support-notices', permissions: [Permission.ManageNews] },
          { id: 'support-resource-categories', label: '政府補助資源分類', url: '/support-resources/categories', permissions: [Permission.ManageCategories] },
          { id: 'support-resource-list', label: '政府補助資源', url: '/support-resources', permissions: [Permission.ManageNews] },
        ],
      },
    ],
  },
  // ───── 前台主選單：推廣專區（產業案例、影音專區、我要投稿）─────
  {
    id: 'promotion-zone',
    label: '推廣專區',
    icon: 'lucide--trophy',
    permissions: [Permission.ManageSiteContent, Permission.ManageMedia],
    children: [
      { id: 'success-cases', label: '產業案例', url: '/success-cases', permissions: [Permission.ManageSiteContent] },
      { id: 'videos', label: '影音專區', url: '/content/videos', permissions: [Permission.ManageMedia] },
      { id: 'contribute', label: '我要投稿', url: '/content/contribute', permissions: [Permission.ManageSiteContent] },
    ],
  },
  // ───── 前台主選單：我要媒合（企業名錄、媒合對接）─────
  {
    id: 'matching-zone',
    label: '我要媒合',
    icon: 'lucide--handshake',
    permissions: [Permission.ViewCompanies, Permission.ManageProducts, Permission.ManageDemands, Permission.CustomerService],
    children: [
      {
        id: 'companies',
        label: '企業名錄',
        permissions: [Permission.ViewCompanies, Permission.ManageProducts],
        children: [
          { id: 'companies-list', label: '公司列表', url: '/companies', permissions: [Permission.ViewCompanies] },
          { id: 'products-list', label: '產品管理', url: '/products', permissions: [Permission.ManageProducts] },
        ],
      },
      {
        id: 'matching',
        label: '媒合對接',
        permissions: [Permission.ManageDemands, Permission.CustomerService],
        children: [
          { id: 'demands', label: '需求張貼管理', url: '/demands', permissions: [Permission.ManageDemands] },
          { id: 'demand-replies', label: '需求回應', url: '/demand-replies', permissions: [Permission.CustomerService] },
          { id: 'chat-reports', label: '會員檢舉', url: '/chat-reports', permissions: [Permission.CustomerService] },
        ],
      },
    ],
  },
  // ───── 前台主選單：常見問題 ─────
  {
    id: 'faq-zone',
    label: '常見問題',
    icon: 'lucide--circle-help',
    permissions: [Permission.ManageCategories, Permission.ManageQuestions],
    children: [
      { id: 'faq-categories', label: '常見問題類別', url: '/knowledge/faq-categories', permissions: [Permission.ManageCategories] },
      { id: 'faq', label: '常見問題內容', url: '/knowledge/faq', permissions: [Permission.ManageQuestions] },
    ],
  },
  // ───── 後台自己的功能 ─────
  {
    id: 'mou',
    label: '備忘錄管理',
    icon: 'lucide--file-text',
    url: '/mou',
    permissions: [Permission.ManageMemos],
  },
  {
    id: 'inquiries',
    label: '詢問單',
    icon: 'lucide--inbox',
    url: '/inquiries',
    permissions: [Permission.CustomerService],
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
    permissions: [Permission.ManageBanners, Permission.ManageSiteContent, Permission.ManageMedia, Permission.ManageFiles],
    children: [
      { id: 'banners', label: '橫幅管理', url: '/content/banners', permissions: [Permission.ManageBanners] },
      { id: 'popup-announcements', label: '彈窗公告', url: '/content/popup-announcements', permissions: [Permission.ManageSiteContent] },
      { id: 'page-settings', label: '頁面設定', url: '/content/page-settings', permissions: [Permission.ManageSiteContent] },
      { id: 'footer-links', label: '頁尾連結', url: '/content/footer-links', permissions: [Permission.ManageSiteContent] },
      { id: 'files', label: '系統檔案', url: '/content/files', permissions: [Permission.ManageFiles] },
      { id: 'albums', label: '相簿管理', url: '/content/albums', permissions: [Permission.ManageMedia] },
    ],
  },
  {
    id: 'knowledge',
    label: '法規',
    icon: 'lucide--book-open',
    permissions: [Permission.ManageRegulations],
    children: [
      { id: 'regulation-categories', label: '法規類別', url: '/knowledge/regulation-categories', permissions: [Permission.ManageCategories] },
      { id: 'regulations', label: '法條內文', url: '/knowledge/regulations', permissions: [Permission.ManageRegulations] },
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
    permissions: [Permission.ManageSettings, Permission.ManageUsers, Permission.ManageRoles, Permission.ViewActionLogs],
    children: [
      { id: 'system-config', label: '系統配置', url: '/system/config', permissions: [Permission.ManageSettings] },
      { id: 'security', label: '安全設置', url: '/system/security', permissions: [Permission.ManageSettings] },
      { id: 'roles', label: '角色管理', url: '/system/roles', permissions: [Permission.ManageRoles] },
      { id: 'accounts', label: '帳號管理', url: '/system/accounts', permissions: [Permission.ManageUsers] },
      { id: 'action-logs', label: '操作記錄', url: '/system/action-logs', permissions: [Permission.ViewActionLogs] },
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
              <Topbar menuItems={filteredMenuItems} />

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
