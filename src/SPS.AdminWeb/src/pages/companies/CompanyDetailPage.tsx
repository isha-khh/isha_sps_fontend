import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import {
  CompanyTypeBadge,
  CompanyLevelBadge,
  CompanyStatusBadge,
} from '@/components/companies/CompanyBadges';
import { CompanyMembers } from '@/components/companies/CompanyMembers';
import { companiesApi } from '@/lib/api/companies';
import type { Company } from '@/types/company';
import {formatApiPath} from "@/lib/fix-weburl.ts";

export const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');
  const [tagNames, setTagNames] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchCompany = async () => {
      setIsLoading(true);
      try {
        const data = await companiesApi.getCompanyById(id);
        setCompany(data);
      } catch (error) {
        console.error('Failed to fetch company:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const tags = await companiesApi.getCompanyTags(id);
        setTagNames(tags.tagNames ?? []);
      } catch (error) {
        console.error('Failed to fetch company tags:', error);
      }
    };

    fetchCompany();
    fetchTags();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return '-';
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(revenue);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <span className="iconify lucide--building-x size-16 mb-4 text-base-content/40" />
        <p className="text-lg text-base-content/60">公司不存在</p>
        <button onClick={() => navigate('/companies')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="公司詳情"
        items={[
          { label: '公司管理', path: '/companies' },
          { label: '詳情', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <button
          onClick={() => navigate(`/companies/${id}/edit`)}
          className="btn btn-primary"
        >
          <span className="iconify lucide--edit size-4" />
          編輯資料
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="card-title text-2xl mb-2">{company.name}</h2>
              {company.englishName && (
                <p className="text-base-content/70">{company.englishName}</p>
              )}
              <p className="text-sm text-base-content/60 mt-1">
                公司編號: {company.number}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <CompanyTypeBadge type={company.type} />
              <CompanyLevelBadge level={company.level} />
              <CompanyStatusBadge status={company.status} />
              {company.isVerified ? (
                <span className="badge badge-success">
                  <span className="iconify lucide--badge-check size-4 mr-1" />
                  已驗證
                </span>
              ) : (
                <span className="badge badge-warning">
                  <span className="iconify lucide--alert-circle size-4 mr-1" />
                  未驗證
                </span>
              )}
            </div>
          </div>

          <div role="tablist" className="tabs tabs-lifted tabs-lg mb-6">
            <a
              role="tab"
              className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              基本資料
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              公司成員
            </a>
          </div>

          {activeTab === 'details' ? (
            <div className="grid gap-6">
              {/* 公司圖片 */}
              {(company.photo || company.banner) && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="iconify lucide--image size-5" />
                      公司圖片
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.photo && (
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">公司 Logo</span>
                          </label>
                          <img
                            src={formatApiPath(company.photo.uri) || ''}
                            alt="公司 Logo"
                            className="w-full max-w-xs h-32 object-contain rounded-lg bg-base-200"
                          />
                        </div>
                      )}
                      {company.banner && (
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">橫幅圖片</span>
                          </label>
                          <img
                            src={formatApiPath(company.banner.uri) || ''}
                            alt="橫幅圖片"
                            className="w-full h-32 object-cover rounded-lg bg-base-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="divider" />
                </>
              )}

              {/* 基本資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--building-2 size-5" />
                  基本資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">統一編號</span>
                    </label>
                    <p className="text-base-content font-mono">
                      {company.unifiedSocialCreditCode || '-'}
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">成立日期</span>
                    </label>
                    <p className="text-base-content">{formatDate(company.establishmentDate)}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公司電話</span>
                    </label>
                    <p className="text-base-content">{company.phone || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">傳真號碼</span>
                    </label>
                    <p className="text-base-content">{company.fax || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">員工數</span>
                    </label>
                    <p className="text-base-content">
                      {company.employees?.toLocaleString() || '-'} 人
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">年營收</span>
                    </label>
                    <p className="text-base-content">{formatRevenue(company.revenue)}</p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 負責人資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--user size-5" />
                  負責人資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">負責人姓名</span>
                    </label>
                    <p className="text-base-content">{company.charge || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">職稱</span>
                    </label>
                    <p className="text-base-content">{company.chargeJobTitle || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">電子郵件</span>
                    </label>
                    <p className="text-base-content">{company.chargeEmail || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">聯絡電話</span>
                    </label>
                    <p className="text-base-content">{company.chargePhone || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">手機號碼</span>
                    </label>
                    <p className="text-base-content">{company.chargeMobile || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 公司地址 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--map-pin size-5" />
                  公司地址
                </h3>
                {company.address ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">郵遞區號</span>
                      </label>
                      <p className="text-base-content">{company.address.postalCode || '-'}</p>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">縣市</span>
                      </label>
                      <p className="text-base-content">{company.address.city || '-'}</p>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">區域</span>
                      </label>
                      <p className="text-base-content">{company.address.district || '-'}</p>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">詳細地址</span>
                      </label>
                      <p className="text-base-content">{company.address.line || '-'}</p>
                    </div>
                    {company.address.description && (
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">地址備註</span>
                        </label>
                        <p className="text-base-content">{company.address.description}</p>
                      </div>
                    )}
                    <div className="form-control md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">完整地址</span>
                      </label>
                      <p className="text-base-content font-medium">
                        {[
                          company.address.postalCode,
                          company.address.city,
                          company.address.district,
                          company.address.line,
                        ]
                          .filter(Boolean)
                          .join(' ') || '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-base-content/60">尚未填寫地址資訊</p>
                )}
              </div>

              <div className="divider" />

              {/* 公司介紹 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--file-text size-5" />
                  公司介紹
                </h3>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">經營項目</span>
                    </label>
                    <p className="text-base-content">{company.subject || '-'}</p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">中文介紹</span>
                    </label>
                    <p className="text-base-content whitespace-pre-wrap">
                      {company.introduction || '-'}
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">英文介紹</span>
                    </label>
                    <p className="text-base-content whitespace-pre-wrap">
                      {company.introductionEnglish || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* 線上資源 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--link size-5" />
                  線上資源
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">官方網站</span>
                    </label>
                    {company.orgUrl ? (
                      <a
                        href={company.orgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        {company.orgUrl}
                      </a>
                    ) : (
                      <p className="text-base-content">-</p>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">介紹影片</span>
                    </label>
                    {company.videoUrl ? (
                      <a
                        href={company.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        {company.videoUrl}
                      </a>
                    ) : (
                      <p className="text-base-content">-</p>
                    )}
                  </div>
                </div>
              </div>

              {company.remark && (
                <>
                  <div className="divider" />
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="iconify lucide--sticky-note size-5" />
                      備註
                    </h3>
                    <div className="alert alert-info">
                      <span className="iconify lucide--info size-5" />
                      <p>{company.remark}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="divider" />

              {/* 企業標籤 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--tags size-5" />
                  企業標籤
                </h3>
                {tagNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tagNames.map((name) => (
                      <span key={name} className="badge badge-primary badge-lg">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-base-content/60">尚未綁定企業標籤</p>
                )}
              </div>

              <div className="divider" />

              {/* 系統資訊 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="iconify lucide--clock size-5" />
                  系統資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">建立時間</span>
                    </label>
                    <p className="text-sm text-base-content/70">
                      {formatDateTime(company.createdTime)}
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">最後更新</span>
                    </label>
                    <p className="text-sm text-base-content/70">
                      {formatDateTime(company.updatedTime)}
                    </p>
                  </div>
                  {company.isVerified && company.verifiedAt && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">驗證時間</span>
                      </label>
                      <p className="text-sm text-base-content/70">
                        {formatDateTime(company.verifiedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <CompanyMembers companyId={id!} />
          )}
        </div>
      </div>
    </div>
  );
};

