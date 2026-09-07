import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { companiesApi } from '@/lib/api/companies';
import { picturesApi } from '@/lib/api/pictures';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { TagCategoryTreeSelect } from '@/components/shared/TagCategoryTreeSelect';
import {CompanyType, CompanyLevel, Status, type CreateCompanyRequest, type UpdateCompanyRequest, type AddressDto, type CompanyTagOption} from '@/types/company';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { useNotify } from '@/hooks/useNotify';
import {formatApiPath} from "@/lib/fix-weburl.ts";

interface ImageInfo {
  id: number;
  uri?: string;
}


export const CompanyFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== 'create';

  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: '',
    englishName: '',
    unifiedSocialCreditCode: '',
    phone: '',
    fax: '',
    type: CompanyType.Supplier,
    level: CompanyLevel.Regular,
    revenue: 0,
    employees: 0,
    subject: '',
    introduction: '',
    introductionEnglish: '',
    orgUrl: '',
    videoUrl: '',
    charge: '',
    chargeEmail: '',
    chargePhone: '',
    chargeMobile: '',
    chargeJobTitle: '',
    establishmentDate: '',
    remark: '',
  });

  const [address, setAddress] = useState<AddressDto>({
    type: 0,
    postalCode: '',
    region: '',
    city: '',
    district: '',
    line: '',
    description: '',
  });

  const [status, setStatus] = useState<Status>(Status.Active);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Image states
  const [photoId, setPhotoId] = useState<number | undefined>();
  const [bannerId, setBannerId] = useState<number | undefined>();
  const [existingPhoto, setExistingPhoto] = useState<ImageInfo | undefined>();
  const [existingBanner, setExistingBanner] = useState<ImageInfo | undefined>();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isBannerPickerOpen, setIsBannerPickerOpen] = useState(false);

  // 企業標籤
  const [availableTags, setAvailableTags] = useState<CompanyTagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchCompany = async () => {
      setIsLoading(true);
      try {
        const data = await companiesApi.getCompanyById(id!);
        setFormData({
          name: data.name,
          englishName: data.englishName || '',
          unifiedSocialCreditCode: data.unifiedSocialCreditCode || '',
          phone: data.phone || '',
          fax: data.fax || '',
          type: data.type,
          level: data.level,
          revenue: data.revenue || 0,
          employees: data.employees || 0,
          subject: data.subject || '',
          introduction: data.introduction || '',
          introductionEnglish: data.introductionEnglish || '',
          orgUrl: data.orgUrl || '',
          videoUrl: data.videoUrl || '',
          charge: data.charge || '',
          chargeEmail: data.chargeEmail || '',
          chargePhone: data.chargePhone || '',
          chargeMobile: data.chargeMobile || '',
          chargeJobTitle: data.chargeJobTitle || '',
          establishmentDate: data.establishmentDate || '',
          remark: data.remark || '',
        });
        setStatus(data.status);
        if (data.photo) setExistingPhoto(data.photo);
        if (data.banner) setExistingBanner(data.banner);
        if (data.address) {
          setAddress({
            type: data.address.type || 0,
            postalCode: data.address.postalCode || '',
            region: data.address.region || '',
            city: data.address.city || '',
            district: data.address.district || '',
            line: data.address.line || '',
            description: data.address.description || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
        await notify.error('載入公司資料失敗');
        navigate('/companies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [id, isEditMode, navigate]);

  // 載入可選企業標籤，編輯模式下一併載入已綁定標籤
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const options = await companiesApi.getCompanyTagOptions();
        setAvailableTags(options);
        if (isEditMode) {
          const bound = await companiesApi.getCompanyTags(id!);
          setSelectedTagIds(bound.tagIds ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch company tags:', error);
      }
    };

    fetchTags();
  }, [id, isEditMode]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handlePhotoSelect = async (file: FileListItem | FileUploadResponse) => {
    try {
      const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
      const picture = await picturesApi.create({
        name: 'originalFileName' in file ? file.originalFileName : file.fileName,
        type: 0,
        contentType: file.contentType,
        uri: fileUrl,
        published: true,
        ordinal: 0,
        height: 0,
        width: 0,
        dpi: 0,
      });
      setPhotoId(picture.id);
      setExistingPhoto({ id: picture.id, uri: picture.uri });
      setRemovePhoto(false);
    } catch (error) {
      console.error('Failed to create photo picture:', error);
      await notify.error('上傳圖片失敗');
    }
    setIsPhotoPickerOpen(false);
  };

  const handleBannerSelect = async (file: FileListItem | FileUploadResponse) => {
    try {
      const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
      const picture = await picturesApi.create({
        name: 'originalFileName' in file ? file.originalFileName : file.fileName,
        type: 0,
        contentType: file.contentType,
        uri: fileUrl,
        published: true,
        ordinal: 0,
        height: 0,
        width: 0,
        dpi: 0,
      });
      setBannerId(picture.id);
      setExistingBanner({ id: picture.id, uri: picture.uri });
      setRemoveBanner(false);
    } catch (error) {
      console.error('Failed to create banner picture:', error);
      await notify.error('上傳圖片失敗');
    }
    setIsBannerPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await notify.warning('請輸入公司名稱');
      return;
    }

    if (!formData.unifiedSocialCreditCode.trim()) {
        await notify.warning('請輸入統一編號');
        return;
    }

    setIsSaving(true);
    try {
      // 檢查地址是否有填寫任何欄位
      const hasAddress = address.postalCode || address.region || address.city ||
                        address.district || address.line || address.description;

      if (isEditMode) {
        const updateData: UpdateCompanyRequest = {
          ...formData,
          status: status,
          address: hasAddress ? address : undefined,
          photoId,
          bannerId,
          removePhoto,
          removeBanner,
        };
        await companiesApi.updateCompany(id!, updateData);
        await companiesApi.setCompanyTags(id!, selectedTagIds);
      } else {
        const createData: CreateCompanyRequest = {
          ...formData,
          address: hasAddress ? address : undefined,
          photoId,
          bannerId,
        };
        const created = await companiesApi.createCompany(createData);
        if (selectedTagIds.length > 0) {
          await companiesApi.setCompanyTags(created.id, selectedTagIds);
        }
      }

      navigate('/companies');
    } catch (error) {
      console.error('Failed to save company:', error);
      await notify.error('儲存公司資料失敗，請稍後再試');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-6">
      <PageTitle
        title={isEditMode ? '編輯公司' : '新增公司'}
        items={[
          { label: '公司管理', path: '/companies' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側主要資訊 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--building-2 size-6" />
                  基本資訊
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">公司名稱 <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">英文名稱</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.englishName}
                      onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">統一編號 <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered font-mono"
                      value={formData.unifiedSocialCreditCode}
                      onChange={(e) => setFormData({ ...formData, unifiedSocialCreditCode: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">成立日期</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={formData.establishmentDate?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, establishmentDate: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公司電話</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">傳真號碼</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.fax}
                      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">員工數</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">年營收 (TWD)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--file-text size-6" />
                  詳細介紹
                </h2>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">經營項目</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">中文介紹</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-32"
                      value={formData.introduction}
                      onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">英文介紹</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-32"
                      value={formData.introductionEnglish}
                      onChange={(e) => setFormData({ ...formData, introductionEnglish: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--user size-6" />
                  負責人資訊
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">負責人姓名</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.charge}
                      onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">職稱</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.chargeJobTitle}
                      onChange={(e) => setFormData({ ...formData, chargeJobTitle: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">電子郵件</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered"
                      value={formData.chargeEmail}
                      onChange={(e) => setFormData({ ...formData, chargeEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">聯絡電話</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.chargePhone}
                      onChange={(e) => setFormData({ ...formData, chargePhone: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">手機號碼</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.chargeMobile}
                      onChange={(e) => setFormData({ ...formData, chargeMobile: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--map-pin size-6" />
                  公司地址
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">郵遞區號</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="例：100"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">縣市</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="例：台北市"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">區域</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={address.district}
                      onChange={(e) => setAddress({ ...address, district: e.target.value })}
                      placeholder="例：中正區"
                    />
                  </div>

                  <div className="form-control md:col-span-3">
                    <label className="label">
                      <span className="label-text font-medium">詳細地址</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={address.line}
                      onChange={(e) => setAddress({ ...address, line: e.target.value })}
                      placeholder="例：忠孝東路一段100號5樓"
                    />
                  </div>

                  <div className="form-control md:col-span-3">
                    <label className="label">
                      <span className="label-text font-medium">地址備註</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={address.description}
                      onChange={(e) => setAddress({ ...address, description: e.target.value })}
                      placeholder="例：近捷運站"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右側側邊資訊 */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--settings size-6" />
                  分類與狀態
                </h2>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公司類型</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) as CompanyType })}
                    >
                      <option value={CompanyType.Supplier}>供給端</option>
                      <option value={CompanyType.Buyer}>需求端</option>
                      <option value={CompanyType.Both}>供需雙方</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">公司級別</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) as CompanyLevel })}
                    >
                      <option value={CompanyLevel.Regular}>普通</option>
                      <option value={CompanyLevel.Silver}>銀牌</option>
                      <option value={CompanyLevel.Gold}>金牌</option>
                      <option value={CompanyLevel.Diamond}>鑽石</option>
                    </select>
                  </div>

                  {isEditMode && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">帳號狀態</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={status}
                        onChange={(e) => setStatus(Number(e.target.value) as Status)}
                      >
                        <option value={Status.Active}>啟用</option>
                        <option value={Status.Inactive}>停用</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--link size-6" />
                  資源與網址
                </h2>

                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">官方網站</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      value={formData.orgUrl}
                      onChange={(e) => setFormData({ ...formData, orgUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">介紹影片</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--sticky-note size-6" />
                  備註
                </h2>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>
            </div>

            {/* 企業標籤 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--tags size-6" />
                  企業標籤
                  {selectedTagIds.length > 0 && (
                    <span className="badge badge-primary badge-sm">{selectedTagIds.length}</span>
                  )}
                </h2>

                <TagCategoryTreeSelect
                  options={availableTags}
                  selectedIds={selectedTagIds}
                  onToggle={toggleTag}
                  emptyText="尚無可用的企業標籤"
                />
              </div>
            </div>

            {/* 公司 Logo */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--image size-6" />
                  公司 Logo
                </h2>
                {existingPhoto && !removePhoto ? (
                  <div className="space-y-3">
                    <img
                      src={formatApiPath(existingPhoto.uri) || ''}
                      alt="公司 Logo"
                      className="w-full h-32 object-contain rounded-lg bg-base-200"
                    />
                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-block"
                      onClick={() => {
                        setRemovePhoto(true);
                        setExistingPhoto(undefined);
                        setPhotoId(undefined);
                      }}
                    >
                      <span className="iconify lucide--trash-2 size-4" />
                      移除 Logo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setIsPhotoPickerOpen(true)}
                  >
                    <span className="iconify lucide--upload size-4" />
                    選擇 Logo 圖片
                  </button>
                )}
              </div>
            </div>

            {/* 橫幅圖片 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--panorama size-6" />
                  橫幅圖片
                </h2>
                {existingBanner && !removeBanner ? (
                  <div className="space-y-3">
                    <img
                      src={formatApiPath(existingBanner.uri) || ''}
                      alt="橫幅圖片"
                      className="w-full h-32 object-cover rounded-lg bg-base-200"
                    />
                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-block"
                      onClick={() => {
                        setRemoveBanner(true);
                        setExistingBanner(undefined);
                        setBannerId(undefined);
                      }}
                    >
                      <span className="iconify lucide--trash-2 size-4" />
                      移除橫幅
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setIsBannerPickerOpen(true)}
                  >
                    <span className="iconify lucide--upload size-4" />
                    選擇橫幅圖片
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--save size-5" />
                    儲存資料
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-block"
                disabled={isSaving}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </form>

      <FilePickerModal
        isOpen={isPhotoPickerOpen}
        onClose={() => setIsPhotoPickerOpen(false)}
        onSelect={handlePhotoSelect}
        fileType="image"
        title="選擇公司 Logo"
      />

      <FilePickerModal
        isOpen={isBannerPickerOpen}
        onClose={() => setIsBannerPickerOpen(false)}
        onSelect={handleBannerSelect}
        fileType="image"
        title="選擇橫幅圖片"
      />
    </div>
  );
};
