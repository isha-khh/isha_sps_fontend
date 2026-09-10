import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

// Applications
import { ApplicationsOverviewPage } from '@/pages/applications/ApplicationsOverviewPage';
import { PendingApplicationsPage } from '@/pages/applications/PendingApplicationsPage';
import { UnderReviewApplicationsPage } from '@/pages/applications/UnderReviewApplicationsPage';
import { CompletedApplicationsPage } from '@/pages/applications/CompletedApplicationsPage';
import { ApplicationDetailPage } from '@/pages/applications/ApplicationDetailPage';

// Members
import { MembersListPage } from '@/pages/members/MembersListPage';
import { MemberDetailPage } from '@/pages/members/MemberDetailPage';

// Companies
import { CompaniesListPage } from '@/pages/companies/CompaniesListPage';
import { CompanyDetailPage } from '@/pages/companies/CompanyDetailPage';
import { CompanyFormPage } from '@/pages/companies/CompanyFormPage';

// Products
import { ProductsListPage } from '@/pages/products/ProductsListPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { ProductFormPage } from '@/pages/products/ProductFormPage';

// Demands
import { DemandsListPage } from '@/pages/demands/DemandsListPage';
import { DemandDetailPage } from '@/pages/demands/DemandDetailPage';
import { DemandFormPage } from '@/pages/demands/DemandFormPage';

// News
import { NewsListPage } from '@/pages/news/NewsListPage';
import { NewsDetailPage } from '@/pages/news/NewsDetailPage';
import { NewsFormPage } from '@/pages/news/NewsFormPage';

// MOU
import { MouListPage } from '@/pages/mou/MouListPage';
import { MouDetailPage } from '@/pages/mou/MouDetailPage';
import { MouFormPage } from '@/pages/mou/MouFormPage';

// Taxonomy
import { CategoriesPage } from '@/pages/taxonomy/CategoriesPage';

// Content
import { BannersPage } from '@/pages/content/BannersPage';
import { PopupAnnouncementsPage } from '@/pages/content/PopupAnnouncementsPage';
import { PopupAnnouncementFormPage } from '@/pages/content/PopupAnnouncementFormPage';

import { FilesPage } from '@/pages/content/FilesPage';
import { AlbumsPage } from '@/pages/content/AlbumsPage';
import { VideosPage } from '@/pages/content/VideosPage';

// Success Cases
import { SuccessCasesListPage } from '@/pages/success-cases/SuccessCasesListPage';
import { SuccessCaseDetailPage } from '@/pages/success-cases/SuccessCaseDetailPage';
import { SuccessCaseFormPage } from '@/pages/success-cases/SuccessCaseFormPage';

// Chat
import { ChatPage } from '@/pages/chat/ChatPage';

// Announcements
import { AnnouncementCategoriesPage } from '@/pages/announcements/CategoriesPage';

// Knowledge
import { RegulationCategoriesPage } from '@/pages/knowledge/RegulationCategoriesPage';
import { RegulationsPage } from '@/pages/knowledge/RegulationsPage';
import { RegulationFormPage } from '@/pages/knowledge/RegulationFormPage';
import { FaqCategoriesPage } from '@/pages/knowledge/FaqCategoriesPage';
import { FaqPage } from '@/pages/knowledge/FaqPage';
import { FaqFormPage } from '@/pages/knowledge/FaqFormPage';

// System
import { SystemConfigPage } from '@/pages/system/ConfigPage';
import { SecurityPage } from '@/pages/system/SecurityPage';
import { EmailTemplatesPage } from '@/pages/mail-center/EmailTemplatesPage';
import { RolesPage } from '@/pages/system/RolesPage';
import { AccountsPage } from '@/pages/system/AccountsPage';
import { ActionLogsPage } from '@/pages/system/ActionLogsPage';
import { SystemInfoPage } from '@/pages/system/SystemInfoPage';
import { AppearancePage } from '@/pages/system/AppearancePage';

// Analytics
import {
  AnalyticsOverviewPage,
  TrafficAnalyticsPage,
  BusinessAnalyticsPage,
  ContentAnalyticsPage,
  SystemAnalyticsPage,
} from '@/pages/analytics';

// Notifications
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';

// 郵件中心
import { MailComposePage } from '@/pages/mail-center/MailComposePage';
import { MailCampaignsPage } from '@/pages/mail-center/MailCampaignsPage';
import { MailLogsPage } from '@/pages/mail-center/MailLogsPage';
import { MailBouncesPage } from '@/pages/mail-center/MailBouncesPage';

// Profile
import { ProfilePage } from '@/pages/profile/ProfilePage';

// Test
import DropdownTestPage from '@/pages/test/DropdownTestPage';

import AuthLayout from "@/pages/auth/layout.tsx";

import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";



function App() {
  return (

      <Routes>

        <Route path="/login" element={

                              <AuthLayout >
                                        <LoginPage/>
                            </AuthLayout>
        } />

        <Route path="/register" element={
                              <AuthLayout >
                                        <RegisterPage/>
                            </AuthLayout>
        } />

        <Route path="/forgot-password" element={
                              <AuthLayout >
                                        <ForgotPasswordPage/>
                            </AuthLayout>
        } />

        <Route path="/reset-password" element={
                              <AuthLayout >
                                        <ResetPasswordPage/>
                            </AuthLayout>
        } />

          <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout /> {/* 這裡直接放 Layout 元件，不要再包 <Route> */}
                </ProtectedRoute>
              }
            >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* 個人資料 */}
          <Route path="profile" element={<ProfilePage />} />

          {/* 會員管理 */}
          <Route path="members" element={<MembersListPage />} />
          <Route path="members/:id" element={<MemberDetailPage />} />

          {/* 申請管理 */}
          <Route path="applications" element={<ApplicationsOverviewPage />} />
          <Route path="applications/pending" element={<PendingApplicationsPage />} />
          <Route path="applications/under-review" element={<UnderReviewApplicationsPage />} />
          <Route path="applications/completed" element={<CompletedApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />

          {/* 公司管理 */}
          <Route path="companies" element={<CompaniesListPage />} />
          <Route path="companies/create" element={<CompanyFormPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
          <Route path="companies/:id/edit" element={<CompanyFormPage />} />

          {/* 產品管理 */}
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/create" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />

          {/* 備忘錄管理 */}
          <Route path="mou" element={<MouListPage />} />
          <Route path="mou/:id" element={<MouDetailPage />} />
          <Route path="mou/:id/edit" element={<MouFormPage />} />

          {/* 需求張貼管理 */}
          <Route path="demands" element={<DemandsListPage />} />
          <Route path="demands/new" element={<DemandFormPage />} />
          <Route path="demands/:id" element={<DemandDetailPage />} />
          <Route path="demands/:id/edit" element={<DemandFormPage />} />

          {/* 聊一聊 */}
          <Route path="chat" element={<ChatPage />} />

          {/* 分類管理 */}
          <Route path="taxonomy/categories" element={<CategoriesPage />} />

          {/* 內容管理 */}
          <Route path="content/banners" element={<BannersPage />} />
          <Route path="content/files" element={<FilesPage />} />
          <Route path="content/albums" element={<AlbumsPage />} />
          <Route path="content/videos" element={<VideosPage />} />
          <Route path="content/popup-announcements" element={<PopupAnnouncementsPage />} />
          <Route path="content/popup-announcements/:id/edit" element={<PopupAnnouncementFormPage />} />

          {/* 公告管理 */}
          <Route path="announcements/categories" element={<AnnouncementCategoriesPage />} />
          <Route path="announcements" element={<NewsListPage />} />
          <Route path="announcements/:id" element={<NewsDetailPage />} />
          <Route path="announcements/:id/edit" element={<NewsFormPage />} />

          {/* 成功案例 */}
          <Route path="success-cases" element={<SuccessCasesListPage />} />
          <Route path="success-cases/:id" element={<SuccessCaseDetailPage />} />
          <Route path="success-cases/:id/edit" element={<SuccessCaseFormPage />} />

          {/* 知識庫 */}
          <Route path="knowledge/regulation-categories" element={<RegulationCategoriesPage />} />
          <Route path="knowledge/regulations" element={<RegulationsPage />} />
          <Route path="knowledge/regulations/:id/edit" element={<RegulationFormPage />} />
          <Route path="knowledge/faq-categories" element={<FaqCategoriesPage />} />
          <Route path="knowledge/faq" element={<FaqPage />} />
          <Route path="knowledge/faq/:id/edit" element={<FaqFormPage />} />

          {/* 系統管理 */}
          <Route path="system/config" element={<SystemConfigPage />} />
          <Route path="system/security" element={<SecurityPage />} />
          {/* 舊路徑保留為 redirect（信件範本已搬到 /mail-center/templates） */}
          <Route
            path="system/email-templates"
            element={<Navigate to="/mail-center/templates" replace />}
          />
          <Route path="system/roles" element={<RolesPage />} />
          <Route path="system/accounts" element={<AccountsPage />} />
          <Route path="system/action-logs" element={<ActionLogsPage />} />
          <Route path="system/info" element={<SystemInfoPage />} />
          <Route path="system/appearance" element={<AppearancePage />} />
          <Route path="system/notifications" element={<NotificationsPage />} />

          {/* 郵件中心 */}
          <Route path="mail-center/compose" element={<MailComposePage />} />
          <Route path="mail-center/campaigns" element={<MailCampaignsPage />} />
          <Route path="mail-center/logs" element={<MailLogsPage />} />
          <Route path="mail-center/bounces" element={<MailBouncesPage />} />
          <Route path="mail-center/templates" element={<EmailTemplatesPage />} />

          {/* 測試頁面 */}
          <Route path="test/dropdown" element={<DropdownTestPage />} />

          {/* 分析報表 */}
          <Route path="analytics" element={<AnalyticsOverviewPage />} />
          <Route path="analytics/traffic" element={<TrafficAnalyticsPage />} />
          <Route path="analytics/business" element={<BusinessAnalyticsPage />} />
          <Route path="analytics/content" element={<ContentAnalyticsPage />} />
          <Route path="analytics/system" element={<SystemAnalyticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

  );
}

export default App;
