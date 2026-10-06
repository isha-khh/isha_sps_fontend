import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import { companiesApi } from '@/lib/api/companies';
import { ExpertScoringSection } from '@/components/applications/ExpertScoringSection';
import { ResendEmailModal } from '@/components/applications/ResendEmailModal';
import { usePermission, Permission } from '@/hooks/usePermission';
import { ApplicantType } from '@/types/api';

import type {
  DocumentType as ApiDocType ,
  Application, ApplicationMember, Document } from '@/types/api';

import type { ApplicationLog } from '@/types/logs.ts';
import { useNotify } from '@/hooks/useNotify';

const DocumentTypeLabels: Record<number, string> = {
  1: '公司登記證明',
  2: '個人資料告知事項及同意書',
  3: '技術服務能量登錄',
  4: '雲市集',
  5: '數位服務機構證明',
  6: '一般申請書',
  7: '其他佐證文件',
  8: '公司 LOGO',
};

const MemberRoleLabels: Record<number, string> = {
  0: '無（個人會員）',
  1: '供給端',
  2: '需求端',
};

const ApplicantTypeLabels: Record<number, string> = {
  1: '個人會員',
  2: '企業會員',
};

// 卓越/新興只是審查路徑紀錄，不是等級高低（見 types/company.ts 的 CompanyLevel 說明）
const SupplierTierLabels: Record<number, string> = {
  1: '卓越會員（文件審查）',
  2: '新興會員（文件審查＋專家委員評分）',
};

const MemberPositionLabels: Record<number, string> = {
  1: '經理',
  2: '員工',
};

const StatusLabels: Record<number, string> = {
  0: '草稿',
  1: '待審核',
  2: '審核中',
  3: '已通過',
  4: '已拒絕',
  6: '已取消',
};

const ApplicationStatusEnum = {
  Draft: 0,
  PendingReview: 1,
  UnderReview: 2,
  Approved: 3,
  Rejected: 4,
  Cancelled: 6,
} as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const ApplicationDetailPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocType, setUploadDocType] = useState<number>(1);
  // 申請裡勾選的標籤只存 id，顯示時要對照企業標籤名稱
  const [tagNameById, setTagNameById] = useState<Record<number, string>>({});
  useEffect(() => {
    companiesApi
      .getCompanyTagOptions()
      .then((options) => setTagNameById(Object.fromEntries(options.map((o) => [o.id, o.name]))))
      .catch(() => {});
  }, []);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const { has: hasPerm } = usePermission();

  const fetchApplication = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminApplicationsApi.getApplicationById(id);
      setApplication(data);
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplication();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const isUnderReview = application?.status === ApplicationStatusEnum.UnderReview;
  // 草稿與已取消的申請沒有可補寄的信；需要維護申請的權限
  const canResendEmail =
    hasPerm(Permission.ManageApplications) &&
    (application?.status === ApplicationStatusEnum.PendingReview ||
      application?.status === ApplicationStatusEnum.UnderReview ||
      application?.status === ApplicationStatusEnum.Approved ||
      application?.status === ApplicationStatusEnum.Rejected);
  const isIndividual = application?.applicantType === ApplicantType.Individual;
  const isEmerging = application?.supplierTier === 2;
  // 決議（核准/退回）之後評分只能檢視，不能再新增或刪除
  const canEditScores =
    application?.status === ApplicationStatusEnum.PendingReview || application?.status === ApplicationStatusEnum.UnderReview;


  const handleDownload = async (documentId: string) => {
    try {
      await adminApplicationsApi.downloadDocument(documentId);
    } catch {
      await notify.error('下載失敗');
    }
  };

  const handleDownloadAll = async () => {
    if (!id) return;
    setDownloadingAll(true);
    try {
      await adminApplicationsApi.downloadAllDocuments(id);
    } catch {
      await notify.error('打包下載失敗');
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!id || !uploadDocType) return;
    setUploading(true);
    try {

      await adminApplicationsApi.uploadDocumentByAdmin({
        applicationId: id,
        type: uploadDocType as ApiDocType,
        file,
      });
      await fetchApplication();
    } catch {
      await notify.error('上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('確定要刪除此附件嗎？')) return;
    try {
      await adminApplicationsApi.deleteDocumentByAdmin(documentId);
      await fetchApplication();
    } catch {
      await notify.error('刪除失敗');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <span className="iconify lucide--file-question size-16 mb-4 text-base-content/40" />
        <p className="text-lg text-base-content/60">申請不存在</p>
        <button onClick={() => navigate('/applications')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="申請詳情"
        items={[
          { label: '申請管理', path: '/applications' },
          { label: '詳情', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      {/* 基本資訊 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <h2 className="card-title text-2xl">
              申請編號: {application.applicationNumber}
            </h2>
            <div className="flex items-center gap-3">
              {canResendEmail && (
                <button className="btn btn-sm btn-outline" onClick={() => setIsResendOpen(true)}>
                  <span className="iconify lucide--mail size-4" />
                  補寄通知信
                </button>
              )}
              <ApplicationStatusBadge status={application.status} />
            </div>
          </div>

          {/* 申請說明 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="iconify lucide--file-text size-5" />
              申請說明
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">申請類型</span></label>
                <p className="text-base-content">
                  {ApplicantTypeLabels[application.applicantType ?? 0] || '-'}
                  {application.existingMemberId && (
                    <span className="badge badge-info ml-2">既有會員升級</span>
                  )}
                </p>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">會員角色</span></label>
                <p className="text-base-content">{MemberRoleLabels[application.memberRole] ?? '-'}</p>
              </div>
              {application.supplierTier ? (
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">供給端分類</span></label>
                  <p className="text-base-content">{SupplierTierLabels[application.supplierTier] || '-'}</p>
                </div>
              ) : null}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">申請理由</span></label>
                <p className="text-base-content">{application.reason || '-'}</p>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">備註</span></label>
                <p className="text-base-content">{application.remark || '-'}</p>
              </div>
              {application.rejectionReason && (
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium text-error">拒絕原因</span></label>
                  <div className="alert alert-error">
                    <p>{application.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* 企業詳細資訊 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="iconify lucide--building-2 size-5" />
              {isIndividual ? '任職資訊' : '企業資訊'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{isIndividual ? '所屬公司名稱' : '公司名稱'}</span>
                </label>
                <p className="text-base-content">{application.companyName || '-'}</p>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">產業別</span></label>
                <p className="text-base-content">{application.industry || '-'}</p>
              </div>
              {!isIndividual && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">統一編號</span></label>
                    <p className="text-base-content">{application.unifiedSocialCreditCode || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">公司地址</span></label>
                    <p className="text-base-content">{application.companyAddress || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">營業範圍</span></label>
                    <p className="text-base-content">{application.businessScope || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">聯絡人</span></label>
                    <p className="text-base-content">{application.contactPerson || '-'}</p>
                  </div>
                </>
              )}
            </div>

            {/* 申請時填寫的公司專頁資料：審核通過後會帶進公司資料（企業名錄顯示的就是這些） */}
            {!isIndividual && application.profile && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 text-base-content/80">公司專頁資料（核准後帶入公司）</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['公司電話', application.profile.phone],
                    ['公司地址（郵遞區號／縣市／鄉鎮區）', [application.profile.postalCode, application.profile.city, application.profile.district].filter(Boolean).join(' ')],
                    ['成立日期', application.profile.establishmentDate],
                    ['資本總額', application.profile.revenue != null ? `${application.profile.revenue.toLocaleString()} 元` : ''],
                    ['公司網址', application.profile.orgUrl],
                    ['主要產品暨服務', application.profile.subject],
                    ['工廠名稱', application.profile.factoryName],
                    ['工廠地址', [application.profile.factoryPostalCode, application.profile.factoryCity, application.profile.factoryDistrict, application.profile.factoryAddress].filter(Boolean).join('')],
                  ].map(([label, value]) => (
                    <div className="form-control" key={label}>
                      <label className="label"><span className="label-text font-medium">{label}</span></label>
                      <p className="text-base-content break-all">{value || '-'}</p>
                    </div>
                  ))}
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-medium">公司簡介</span></label>
                    <p className="text-base-content whitespace-pre-wrap">{application.profile.introduction || '-'}</p>
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-medium">標籤（應用情境／應用範疇／智慧技術）</span></label>
                    <div className="flex flex-wrap gap-2">
                      {application.profile.tagIds.length > 0 ? (
                        application.profile.tagIds.map((tagId) => (
                          <span className="badge badge-outline" key={tagId}>
                            {tagNameById[tagId] ?? `#${tagId}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-base-content">-</span>
                      )}
                    </div>
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-medium">獲獎事蹟暨重要合作案例</span></label>
                    <p className="text-base-content whitespace-pre-wrap">{application.profile.awardNote || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* 審核資訊 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="iconify lucide--file-check size-5" />
              審核資訊
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">提交時間</span></label>
                <p className="text-base-content">{formatDate(application.submittedAt)}</p>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">審核時間</span></label>
                <p className="text-base-content">{formatDate(application.reviewedAt)}</p>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">審核員</span></label>
                <p className="text-base-content">{application.reviewerName || '-'}</p>
              </div>
            </div>
            {application.reviewComment && (
              <div className="form-control mt-4">
                <label className="label"><span className="label-text font-medium">審核意見</span></label>
                <div className="alert">
                  <span className="iconify lucide--message-square size-5" />
                  <p>{application.reviewComment}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 委員評分（只有新興會員申請需要） */}
      {isEmerging && id && (
        <ExpertScoringSection applicationId={id} editable={canEditScores} />
      )}

      {/* 成員列表 */}
      {application.members && application.members.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="iconify lucide--users size-5" />
              成員列表 ({application.members.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>姓名</th>
                    <th>職位</th>
                    <th>Email</th>
                    <th>電話</th>
                    <th>分機</th>
                    <th>手機</th>
                    <th>成員角色</th>
                  </tr>
                </thead>
                <tbody>
                  {application.members.map((member: ApplicationMember, index: number) => (
                    <tr key={member.id}>
                      <td>{index + 1}</td>
                      <td>{member.contactName}</td>
                      <td>{member.position || '-'}</td>
                      <td>{member.email}</td>
                      <td>{member.phone || '-'}</td>
                      <td>{member.extension || '-'}</td>
                      <td>{member.mobilePhone || '-'}</td>
                      <td>
                        <span className={`badge ${member.memberPosition === 1 ? 'badge-primary' : 'badge-ghost'}`}>
                          {MemberPositionLabels[member.memberPosition] || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 附件管理 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="iconify lucide--paperclip size-5" />
              附件列表 ({application.documents?.length || 0})
            </h3>
            <div className="flex gap-2">
              {(application.documents?.length ?? 0) > 0 && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}
                >
                  {downloadingAll ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <span className="iconify lucide--archive size-4" />
                  )}
                  打包下載
                </button>
              )}
              {isUnderReview && (
                <>
                  <select
                    className="select select-sm select-bordered"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(Number(e.target.value))}
                  >
                    {Object.entries(DocumentTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <span className="iconify lucide--upload size-4" />
                    )}
                    上傳附件
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleUpload(file);
                        e.target.value = '';
                      }
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {application.documents && application.documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>文件類型</th>
                    <th>檔名</th>
                    <th>大小</th>
                    <th>上傳時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {application.documents.map((doc: Document) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="badge badge-outline">
                          {DocumentTypeLabels[doc.type] || `類型 ${doc.type}`}
                        </span>
                      </td>
                      <td>{doc.fileName}</td>
                      <td>{formatFileSize(doc.fileSize)}</td>
                      <td>{formatDate(doc.createdTime)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => handleDownload(doc.id)}
                            title="下載"
                          >
                            <span className="iconify lucide--download size-4" />
                          </button>
                          {isUnderReview && (
                            <button
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => handleDelete(doc.id)}
                              title="刪除"
                            >
                              <span className="iconify lucide--trash-2 size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base-content/50 text-center py-4">暫無附件</p>
          )}
        </div>
      </div>

      {/* 操作日誌 */}
      {application.logs && application.logs.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="iconify lucide--history size-5" />
              操作日誌
            </h3>
            <ul className="timeline timeline-vertical timeline-snap-icon">
              {application.logs.map((log: ApplicationLog, index: number) => (
                <li key={log.id}>
                  {index > 0 && <hr />}
                  <div className="timeline-middle">
                    <span className="iconify lucide--circle-dot size-4" />
                  </div>
                  <div className={`${index % 2 === 0 ? 'timeline-start' : 'timeline-end'} mb-10`}>
                    <div className="text-sm text-base-content/60">{formatDate(log.operatedAt)}</div>
                    <div className="font-medium">{log.action || '-'}</div>
                    {log.comment && <div className="text-sm text-base-content/70">{log.comment}</div>}
                    <div className="text-xs text-base-content/50">
                      {log.previousStatus !== undefined && log.previousStatus !== null
                        ? `${StatusLabels[log.previousStatus] || log.previousStatus} → `
                        : ''}
                      {StatusLabels[log.newStatus] || log.newStatus}
                      {log.operatorName && ` | 操作人: ${log.operatorName}`}
                    </div>
                  </div>
                  {index < application.logs!.length - 1 && <hr />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 時間記錄 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="iconify lucide--clock size-5" />
            時間記錄
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">創建時間</span></label>
              <p className="text-sm text-base-content/70">{formatDate(application.createdTime)}</p>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">最後更新</span></label>
              <p className="text-sm text-base-content/70">{formatDate(application.updatedTime)}</p>
            </div>
          </div>
        </div>
      </div>

      <ResendEmailModal
        isOpen={isResendOpen}
        applicationId={application.id}
        applicationNumber={application.applicationNumber}
        currentEmail={application.email}
        canChangeEmail={application.status !== ApplicationStatusEnum.Approved}
        onClose={() => setIsResendOpen(false)}
        onSent={(emailChanged) => {
          // 信箱有更正時重新載入，畫面上的聯絡信箱與申請日誌才會更新
          if (emailChanged) void fetchApplication();
        }}
      />
    </div>
  );
};
