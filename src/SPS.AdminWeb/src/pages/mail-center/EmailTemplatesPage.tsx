import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { settingsApi } from '@/lib/api/system-settings';
import type { EmailTemplate, EmailLayoutSettings } from '@/types/settings';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useNotify } from '@/hooks/useNotify';

type PageTab = 'templates' | 'layout';

const defaultLayout: EmailLayoutSettings = {
  logoUrl: '',
  logoMaxWidthPercent: 70,
  platformName: '智慧石化產業資訊暨媒合平台',
  primaryColor: '#333333',
  contentColor: '#666666',
  footerColor: '#999999',
  footerHtml: '此郵件由系統自動發送，請勿直接回覆。如有問題，請聯繫系統管理員。',
  copyrightText: '',
};

export const EmailTemplatesPage = () => {
  const notify = useNotify();
  const [pageTab, setPageTab] = useState<PageTab>('templates');

  // ==================== 範本相關狀態 ====================
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    isActive: true,
  });

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  // ==================== 版面配置相關狀態 ====================
  const [layout, setLayout] = useState<EmailLayoutSettings>(defaultLayout);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (pageTab === 'layout') {
      fetchLayout();
    }
  }, [pageTab]);

  // ==================== 範本方法 ====================

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await settingsApi.getEmailTemplates();
      setTemplates(result.templates);
      if (result.templates.length > 0 && !selectedTemplate) {
        selectTemplate(result.templates[0]);
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      isActive: template.isActive,
    });
    const vars: Record<string, string> = {};
    template.availableVariables.forEach((v) => {
      vars[v] = getDefaultVariableValue(v);
    });
    setTestVariables(vars);
    setEditMode(false);
    setShowPreview(false);
  };

  const getDefaultVariableValue = (variable: string): string => {
    const defaults: Record<string, string> = {
      code: '123456',
      userName: '測試使用者',
      expireMinutes: '5',
      resetLink: 'https://example.com/reset',
      loginUrl: 'https://example.com/login',
      changeTime: new Date().toLocaleString('zh-TW'),
      ipAddress: '192.168.1.1',
      companyName: '測試公司',
      applicationNumber: 'APP-20240101-001',
      reason: '測試拒絕原因',
      contactName: '測試聯絡人',
      rejectionReason: '測試拒絕原因',
    };
    return defaults[variable] || `{{${variable}}}`;
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      await settingsApi.updateEmailTemplate(selectedTemplate.key, {
        name: editForm.name,
        subject: editForm.subject,
        htmlContent: editForm.htmlContent,
        isActive: editForm.isActive,
      });
      await notify.success('範本已儲存');
      setEditMode(false);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      await notify.error('儲存範本失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    setIsPreviewing(true);
    try {
      const result = await settingsApi.previewEmailTemplate(selectedTemplate.key, {
        variables: testVariables,
      });
      setPreviewSubject(result.subject);
      setPreviewHtml(result.htmlContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview template:', error);
      await notify.error('預覽範本失敗');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) return;
    setIsTesting(true);
    try {
      await settingsApi.testEmailTemplate(selectedTemplate.key, {
        toEmail: testEmail,
        variables: testVariables,
      });
      await notify.success('測試郵件已發送');
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send test email:', error);
      await notify.error('發送測試郵件失敗');
    } finally {
      setIsTesting(false);
    }
  };

  // ==================== 版面配置方法 ====================

  const fetchLayout = async () => {
    setIsLayoutLoading(true);
    try {
      const data = await settingsApi.getEmailLayoutSettings();
      setLayout({ ...defaultLayout, ...data });
    } catch {
      setLayout(defaultLayout);
    } finally {
      setIsLayoutLoading(false);
    }
  };

  const handleLayoutSave = async () => {
    setIsLayoutSaving(true);
    try {
      await settingsApi.updateEmailLayoutSettings(layout);
      await notify.success('版面配置已儲存');
    } catch (error) {
      console.error('Failed to save layout:', error);
      await notify.error('儲存版面配置失敗');
    } finally {
      setIsLayoutSaving(false);
    }
  };

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="信件範本管理"
        items={[
          { label: '郵件中心' },
          { label: '信件範本', active: true },
        ]}
      />

      {/* Tab 切換 */}
      <div role="tablist" className="tabs tabs-bordered">
        <button
          role="tab"
          className={`tab tab-lg gap-2 ${pageTab === 'templates' ? 'tab-active font-semibold' : ''}`}
          onClick={() => setPageTab('templates')}
        >
          <span className="iconify lucide--file-text size-4" />
          信件範本
        </button>
        <button
          role="tab"
          className={`tab tab-lg gap-2 ${pageTab === 'layout' ? 'tab-active font-semibold' : ''}`}
          onClick={() => setPageTab('layout')}
        >
          <span className="iconify lucide--layout size-4" />
          版面配置
        </button>
      </div>

      {/* ==================== 信件範本 Tab ==================== */}
      {pageTab === 'templates' && (
        <div className="grid grid-cols-12 gap-6">
          {/* 範本列表 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title text-base">範本列表</h3>
                <div className="space-y-2 mt-2">
                  {templates.map((template) => (
                    <button
                      key={template.key}
                      onClick={() => selectTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTemplate?.key === template.key
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        {template.isActive ? (
                          <span className="badge badge-success badge-sm">啟用</span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">停用</span>
                        )}
                      </div>
                      <div className="text-sm text-base-content/60 mt-1 truncate">
                        {template.key}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 範本編輯區 */}
          <div className="col-span-12 lg:col-span-8">
            {selectedTemplate && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handlePreview}
                      disabled={isPreviewing}
                    >
                      {isPreviewing ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <span className="iconify lucide--eye size-4" />
                      )}
                      預覽
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowTestModal(true)}
                    >
                      <span className="iconify lucide--send size-4" />
                      測試發送
                    </button>
                    {!editMode ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setEditMode(true)}
                      >
                        <span className="iconify lucide--edit size-4" />
                        編輯
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditMode(false);
                            selectTemplate(selectedTemplate);
                          }}
                        >
                          取消
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <span className="loading loading-spinner loading-sm" />
                          ) : (
                            <span className="iconify lucide--save size-4" />
                          )}
                          儲存
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showPreview ? (
                  <div className="card bg-base-100 shadow">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">預覽結果</h4>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowPreview(false)}
                        >
                          <span className="iconify lucide--x size-4" />
                          關閉預覽
                        </button>
                      </div>
                      <div className="bg-base-200 p-3 rounded mb-4">
                        <span className="text-sm text-base-content/60">主旨：</span>
                        <span className="font-medium ml-2">{previewSubject}</span>
                      </div>
                      <div className="border rounded-lg p-4 bg-white">
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-base-100 shadow">
                    <div className="card-body space-y-4">
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="toggle toggle-success"
                            checked={editForm.isActive}
                            onChange={(e) =>
                              setEditForm({ ...editForm, isActive: e.target.checked })
                            }
                            disabled={!editMode}
                          />
                          <span className="label-text font-medium">啟用此範本</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">範本名稱</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">郵件主旨</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={editForm.subject}
                          onChange={(e) =>
                            setEditForm({ ...editForm, subject: e.target.value })
                          }
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">HTML 內容</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered h-64 font-mono text-sm"
                          value={editForm.htmlContent}
                          onChange={(e) =>
                            setEditForm({ ...editForm, htmlContent: e.target.value })
                          }
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">可用變數</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.availableVariables.map((v) => (
                            <span key={v} className="badge badge-outline font-mono">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h4 className="font-medium mb-4">測試變數</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.availableVariables.map((v) => (
                        <div key={v} className="form-control">
                          <label className="label">
                            <span className="label-text font-mono text-sm">{`{{${v}}}`}</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={testVariables[v] || ''}
                            onChange={(e) =>
                              setTestVariables({ ...testVariables, [v]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 版面配置 Tab ==================== */}
      {pageTab === 'layout' && (
        <div className="max-w-4xl">
          {isLayoutLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左：設定表單 */}
              <div className="space-y-6">
                {/* Logo 設定 */}
                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-base">
                      <span className="iconify lucide--image size-5" />
                      Logo 設定
                    </h3>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Logo 圖片</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {layout.logoUrl ? (
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={layout.logoUrl}
                              alt="Logo"
                              className="h-10 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="text-sm text-base-content/60 truncate flex-1">
                              {layout.logoUrl}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => setLayout({ ...layout, logoUrl: '' })}
                            >
                              <span className="iconify lucide--x size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-base-content/40">尚未選擇 Logo</span>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setIsLogoPickerOpen(true)}
                        >
                          <span className="iconify lucide--image-plus size-4" />
                          {layout.logoUrl ? '更換' : '選擇圖片'}
                        </button>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Logo 最大寬度 (%)</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          className="range range-primary flex-1"
                          min={20}
                          max={100}
                          value={layout.logoMaxWidthPercent}
                          onChange={(e) =>
                            setLayout({ ...layout, logoMaxWidthPercent: Number(e.target.value) })
                          }
                        />
                        <span className="text-sm font-mono w-12 text-right">
                          {layout.logoMaxWidthPercent}%
                        </span>
                      </div>
                    </div>

                    {layout.logoUrl && (
                      <div className="mt-2 p-4 bg-base-200 rounded-lg text-center">
                        <p className="text-xs text-base-content/50 mb-2">Logo 預覽</p>
                        <img
                          src={layout.logoUrl.startsWith('http') ? layout.logoUrl : layout.logoUrl}
                          alt="Logo Preview"
                          style={{ maxWidth: `${layout.logoMaxWidthPercent}%` }}
                          className="inline-block"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 平台資訊 */}
                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-base">
                      <span className="iconify lucide--building size-5" />
                      平台資訊
                    </h3>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">平台名稱</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={layout.platformName}
                        onChange={(e) => setLayout({ ...layout, platformName: e.target.value })}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">頁尾文字</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20 text-sm"
                        value={layout.footerHtml}
                        onChange={(e) => setLayout({ ...layout, footerHtml: e.target.value })}
                        placeholder="支援 HTML"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">版權文字</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={layout.copyrightText}
                        onChange={(e) => setLayout({ ...layout, copyrightText: e.target.value })}
                        placeholder="例：© 2026 智慧石化產業資訊暨媒合平台"
                      />
                    </div>
                  </div>
                </div>

                {/* 顏色設定 */}
                <div className="card bg-base-100 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-base">
                      <span className="iconify lucide--palette size-5" />
                      顏色設定
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">標題色</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded cursor-pointer border-0"
                            value={layout.primaryColor}
                            onChange={(e) => setLayout({ ...layout, primaryColor: e.target.value })}
                          />
                          <input
                            type="text"
                            className="input input-bordered input-sm flex-1 font-mono"
                            value={layout.primaryColor}
                            onChange={(e) => setLayout({ ...layout, primaryColor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">內文色</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded cursor-pointer border-0"
                            value={layout.contentColor}
                            onChange={(e) => setLayout({ ...layout, contentColor: e.target.value })}
                          />
                          <input
                            type="text"
                            className="input input-bordered input-sm flex-1 font-mono"
                            value={layout.contentColor}
                            onChange={(e) => setLayout({ ...layout, contentColor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">頁尾色</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded cursor-pointer border-0"
                            value={layout.footerColor}
                            onChange={(e) => setLayout({ ...layout, footerColor: e.target.value })}
                          />
                          <input
                            type="text"
                            className="input input-bordered input-sm flex-1 font-mono"
                            value={layout.footerColor}
                            onChange={(e) => setLayout({ ...layout, footerColor: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 儲存按鈕 */}
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setLayout(defaultLayout)}
                  >
                    <span className="iconify lucide--rotate-ccw size-4" />
                    還原預設
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleLayoutSave}
                    disabled={isLayoutSaving}
                  >
                    {isLayoutSaving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <span className="iconify lucide--save size-4" />
                    )}
                    儲存版面配置
                  </button>
                </div>
              </div>

              {/* 右：即時預覽 */}
              <div>
                <div className="card bg-base-100 shadow sticky top-4">
                  <div className="card-body">
                    <h3 className="card-title text-base">
                      <span className="iconify lucide--eye size-5" />
                      即時預覽
                    </h3>
                    <div className="border rounded-lg bg-white overflow-hidden">
                      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            padding: 20,
                            borderRadius: 8,
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                          }}
                        >
                          <h2
                            style={{
                              color: layout.primaryColor,
                              marginBottom: 20,
                              fontSize: 18,
                            }}
                          >
                            郵件標題範例
                          </h2>
                          <div style={{ color: layout.contentColor, fontSize: 14 }}>
                            <p style={{ marginBottom: 16 }}>親愛的使用者，您好！</p>
                            <p style={{ marginBottom: 16 }}>
                              這是一封預覽郵件，用於展示版面配置的效果。
                            </p>
                            <div
                              style={{
                                backgroundColor: '#f8f9fa',
                                borderLeft: '4px solid #4285f4',
                                padding: 16,
                                margin: '20px 0',
                              }}
                            >
                              <strong>提示：</strong>此區塊展示強調內容的樣式。
                            </div>
                          </div>
                          <hr
                            style={{
                              margin: '20px 0',
                              border: 'none',
                              borderTop: '1px solid #eee',
                            }}
                          />
                          <p style={{ color: layout.footerColor, fontSize: 12 }}>
                            {layout.footerHtml}
                          </p>
                          {layout.copyrightText && (
                            <p style={{ color: layout.footerColor, fontSize: 11, marginTop: 8 }}>
                              {layout.copyrightText}
                            </p>
                          )}
                        </div>
                        {layout.logoUrl && (
                          <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <img
                              src={
                                layout.logoUrl.startsWith('http')
                                  ? layout.logoUrl
                                  : layout.logoUrl
                              }
                              alt={layout.platformName}
                              style={{
                                maxWidth: `${layout.logoMaxWidthPercent}%`,
                                height: 'auto',
                                alignItems:"center"
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 測試郵件 Modal */}
      {showTestModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">發送測試郵件</h3>
            <p className="py-4 text-base-content/60">
              輸入收件人郵件地址，系統將使用目前的測試變數發送測試郵件。
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text">收件人郵件地址</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="example@domain.com"
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowTestModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendTest}
                disabled={!testEmail || isTesting}
              >
                {isTesting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--send size-4" />
                    發送
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowTestModal(false)} />
        </div>
      )}
      <FilePickerModal
        isOpen={isLogoPickerOpen}
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(file) => {
          const fileId = 'id' in file
            ? (file as FileListItem).id
            : (file as FileUploadResponse).fileId;
          setLayout({ ...layout, logoUrl: `/api/FileManagement/${fileId}/download` });
          setIsLogoPickerOpen(false);
        }}
        fileType="image"
        title="選擇 Logo 圖片"
      />
    </div>
  );
};
