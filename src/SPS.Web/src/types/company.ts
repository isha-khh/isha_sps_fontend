// 公司相關類型定義

export interface AddressDto {
  id?: number;
  type: number;
  postalCode?: string;
  region?: string;
  city?: string;
  district?: string;
  line?: string;
  description?: string;
}

export interface PictureResponse {
  id: number;
  name?: string;
  uri?: string;
  thumbnailUrl?: string;
}

export interface CreateCompanyRequest {
  name: string;
  englishName?: string;
  unifiedSocialCreditCode: string;
  phone?: string;
  fax?: string;
  type: CompanyType;
  level: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  address?: AddressDto;
  photoId?: number;
  bannerId?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  englishName?: string;
  phone?: string;
  fax?: string;
  type?: CompanyType;
  removePhoto?: boolean;
  removeBanner?: boolean;
  level?: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  status?: Status;
  address?: AddressDto;
  photoId?: number;
  bannerId?: number;
}

export const CompanyType = {
  Supplier: 0,
  Demander: 1,
  Both: 2,
} as const;

export type CompanyType = typeof CompanyType[keyof typeof CompanyType];

export const CompanyLevel = {
  Regular: 0,
  Silver: 1,
  Gold: 2,
  Diamond: 3,
} as const;

export type CompanyLevel = typeof CompanyLevel[keyof typeof CompanyLevel];

/**
 * 通用狀態定義 (對應後端 Status Enum)
 * 數值類型為 short (0-6)
 * @description 涵蓋了帳號生命週期狀態（啟用/鎖定）以及審核流程狀態
 */
export const Status = {
    /** * 未啟用 / 停用 (Inactive)
     * @description 初始狀態或已被軟刪除 (Soft Deleted)，通常無法進行登入或主要操作
     */
    Inactive: 0,

    /** * 啟用中 (Active)
     * @description 正常運作狀態，擁有完整權限
     */
    Active: 1,


} as const;

/** * 通用狀態類型聯集
 * @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6} Status
 */
export type Status = typeof Status[keyof typeof Status];

export interface Company {
  id: string;
  number?: string;
  name: string;
  tagNames?: string[];
  englishName?: string;
  unifiedSocialCreditCode?: string;
  phone?: string;
  fax?: string;
  type: CompanyType;
  level: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  status: Status;
  isVerified: boolean;
  verifiedAt?: string;
  address?: AddressDto;
  photo?: PictureResponse;
  banner?: PictureResponse;
  designatedContacts?: DesignatedContact[];
  createdTime: string;
  updatedTime?: string;
}

/**
 * 指定聯絡人資訊
 */
export interface DesignatedContact {
  /** 會員唯一識別碼 (GUID) */
  id: string;
  /** 姓名 */
  name: string;
  /** 電子郵件 */
  email: string;
  /** 電話 */
  phone: string | null;
  /** 行動電話 */
  mobilePhone: string | null;
  /** 職務抬頭 */
  memberJobTitle: string | null;
}

export interface CompanySearchParams {
  search?: string;
  type?: CompanyType;
  level?: CompanyLevel;
  status?: Status;
  isVerified?: boolean;
  sortBy?: string;
  descending?: boolean;
}

export interface CompanyStatistics {
  totalCompanies: number;
  supplierCount: number;
  demanderCount: number;
  bothCount: number;
  verifiedCount: number;
  activeCount: number;
}
